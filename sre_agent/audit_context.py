
from contextvars import ContextVar
from typing import Optional

# Context Variables to hold state during Agent execution
# These are thread-local (or task-local in asyncio), ensuring safety in concurrent execution

_incident_id_ctx = ContextVar("incident_id", default=None)
_agent_name_ctx = ContextVar("agent_name", default="UnknownAgent")

def set_audit_context(incident_id: str, agent_name: str):
    """
    Set the current audit context for the running task.
    """
    _incident_id_ctx.set(incident_id)
    _agent_name_ctx.set(agent_name)

def get_audit_context():
    """
    Retrieve the current audit context.
    Returns: (incident_id, agent_name)
    """
    return _incident_id_ctx.get(), _agent_name_ctx.get()

def clear_audit_context():
    """
    Reset context to defaults.
    """
    _incident_id_ctx.set(None)
    _agent_name_ctx.set("UnknownAgent")
