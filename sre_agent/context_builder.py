#!/usr/bin/env python3

"""
Context Builder for SRE Agent - Alert Enrichment

Enriches Prometheus alerts with additional context before triggering
the investigation graph. Queries infrastructure and runbooks to provide
comprehensive context.
"""

import logging
from typing import Any, Dict, List, Optional

from langchain_core.tools import BaseTool

from .agent_state import AlertContext

# Configure logging with basicConfig
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s,p%(process)s,{%(filename)s:%(lineno)d},%(levelname)s,%(message)s",
)

logger = logging.getLogger(__name__)


class ContextBuilder:
    """Builds enriched context for alerts before investigation."""

    def __init__(self, tools: List[BaseTool]):
        """
        Initialize context builder with available tools.

        Args:
            tools: List of MCP tools available for context enrichment
        """
        self.tools = tools
        logger.info(f"ContextBuilder initialized with {len(tools)} tools")

    def _find_tool(self, tool_name: str) -> Optional[BaseTool]:
        """
        Find a tool by name (handles domain prefixes).

        Args:
            tool_name: Tool name (with or without domain prefix)

        Returns:
            Tool instance or None if not found
        """
        for tool in self.tools:
            tool_base_name = (
                getattr(tool, "name", "").split("___")[-1]
                if "___" in getattr(tool, "name", "")
                else getattr(tool, "name", "")
            )
            if tool_base_name == tool_name:
                return tool
        return None

    async def enrich_alert_context(self, alert: Dict[str, Any]) -> AlertContext:
        """
        Enrich alert with additional context from infrastructure and runbooks.

        Args:
            alert: Prometheus alert payload (single alert object)

        Returns:
            Enriched AlertContext with additional information
        """
        logger.info("🔍 ContextBuilder: Enriching alert context")

        # Extract basic alert information
        labels = alert.get("labels", {})
        annotations = alert.get("annotations", {})
        alert_name = labels.get("alertname", "UnknownAlert")
        pod_name = labels.get("pod")
        namespace = labels.get("namespace", "default")
        severity = labels.get("severity", "warning").lower()

        logger.info(
            f"🔍 ContextBuilder: Alert={alert_name}, Pod={pod_name}, Namespace={namespace}"
        )

        # Step 1: Check pod status (if pod is specified)
        pod_status_info = None
        if pod_name:
            pod_status_tool = self._find_tool("get_pod_status")
            if pod_status_tool:
                try:
                    logger.info(f"🔍 ContextBuilder: Checking pod status for {pod_name}")
                    pod_args = {
                        "pod_name": pod_name,
                        "namespace": namespace,
                    }
                    if hasattr(pod_status_tool, "ainvoke"):
                        pod_result = await pod_status_tool.ainvoke(pod_args)
                    else:
                        pod_result = pod_status_tool.invoke(pod_args)

                    pod_status_info = str(pod_result)[:500]  # Truncate long results
                    logger.info(f"✅ ContextBuilder: Pod status retrieved")
                except Exception as e:
                    logger.warning(f"⚠️ ContextBuilder: Failed to get pod status: {e}")
                    pod_status_info = f"Error retrieving pod status: {str(e)}"
            else:
                logger.warning("⚠️ ContextBuilder: get_pod_status tool not found")

        # Step 2: Search for relevant runbooks
        runbook_info = None
        runbook_tool = self._find_tool("search_runbooks")
        if runbook_tool:
            try:
                logger.info(f"🔍 ContextBuilder: Searching runbooks for alert '{alert_name}'")
                runbook_args = {
                    "incident_type": self._map_alert_to_incident_type(alert_name),
                    "keyword": alert_name,
                    "severity": severity,
                }
                if hasattr(runbook_tool, "ainvoke"):
                    runbook_result = await runbook_tool.ainvoke(runbook_args)
                else:
                    runbook_result = runbook_tool.invoke(runbook_args)

                runbook_info = str(runbook_result)[:500]  # Truncate long results
                logger.info(f"✅ ContextBuilder: Runbook search completed")
            except Exception as e:
                logger.warning(f"⚠️ ContextBuilder: Failed to search runbooks: {e}")
                runbook_info = f"Error searching runbooks: {str(e)}"
        else:
            logger.warning("⚠️ ContextBuilder: search_runbooks tool not found")

        # Step 3: Enrich annotations with context
        enriched_annotations = dict(annotations)
        if pod_status_info:
            enriched_annotations["pod_status_context"] = pod_status_info
        if runbook_info:
            enriched_annotations["runbook_context"] = runbook_info

        # Create enriched AlertContext
        enriched_context = AlertContext(
            alert_name=alert_name,
            severity=severity,  # type: ignore
            labels=labels,
            annotations=enriched_annotations,
            starts_at=alert.get("startsAt"),
            generator_url=alert.get("generatorURL"),
        )

        logger.info(f"✅ ContextBuilder: Context enrichment complete")

        return enriched_context

    def _map_alert_to_incident_type(self, alert_name: str) -> str:
        """
        Map alert name to incident type for runbook search.

        Args:
            alert_name: Name of the alert

        Returns:
            Incident type (performance, availability, security, deployment)
        """
        alert_lower = alert_name.lower()

        if any(keyword in alert_lower for keyword in ["cpu", "memory", "latency", "response"]):
            return "performance"
        elif any(keyword in alert_lower for keyword in ["down", "unavailable", "crash"]):
            return "availability"
        elif any(keyword in alert_lower for keyword in ["security", "vulnerability", "breach"]):
            return "security"
        elif any(keyword in alert_lower for keyword in ["deploy", "rollout", "update"]):
            return "deployment"
        else:
            return "performance"  # Default
