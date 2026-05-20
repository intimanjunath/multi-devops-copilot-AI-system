#!/bin/bash

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$REPO_ROOT/edge_mcp_servers/stop.sh"
bash "$REPO_ROOT/platform/stop.sh"
bash "$REPO_ROOT/Target_Client/start.sh" --down