#!/bin/bash

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$REPO_ROOT/Target_Client/start.sh"
bash "$REPO_ROOT/platform/start.sh"
bash "$REPO_ROOT/edge_mcp_servers/start.sh"

# echo "▶ Running MCP Server Smoke Test..."
# if command -v uv >/dev/null 2>&1; then
# 	uv run python test_mcp_servers.py
# else
# 	python test_mcp_servers.py
# fi