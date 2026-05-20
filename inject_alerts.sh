#!/bin/bash
# Injects realistic SRE alerts into the dashboard every 5 minutes

CLUSTER_TOKEN="cl_58f71c23a54e4b5ab1d10c8defccfc6d"
API="http://localhost:8080"
INTERVAL=300  # 5 minutes

ALERTS=(
  '{"alertname":"HighErrorRate","service":"checkout-service","severity":"critical","summary":"Checkout service error rate exceeded 5%","description":"checkout-service is returning HTTP 5xx errors at 8.3% — above the 5% SLO threshold."}'
  '{"alertname":"PodCrashLooping","service":"inventory-service","severity":"warning","summary":"inventory-service pod is crash looping","description":"Pod inventory-service-bd95d7b85 has restarted 5 times in the last 10 minutes."}'
  '{"alertname":"HighLatency","service":"api-gateway","severity":"critical","summary":"API Gateway p99 latency > 2s","description":"api-gateway p99 response time is 3.4s, breaching the 2s SLO. Upstream timeout suspected."}'
  '{"alertname":"HighMemoryUsage","service":"checkout-service","severity":"warning","summary":"checkout-service memory usage at 92%","description":"checkout-service memory consumption at 92% of limit. OOMKill risk imminent."}'
  '{"alertname":"DeploymentRollout","service":"inventory-service","severity":"info","summary":"New deployment detected on inventory-service","description":"inventory-service rolled out image v2.3.1. Monitoring for regression."}'
)

INDEX=0

send_alert() {
  local alert_json="${ALERTS[$INDEX]}"
  local alertname=$(echo "$alert_json" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d['alertname'])")
  local summary=$(echo "$alert_json"  | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d['summary'])")

  PAYLOAD=$(python3 -c "
import json, sys
a = json.loads('''$alert_json''')
payload = {
  'version': '4',
  'groupKey': 'demo-group',
  'status': 'firing',
  'receiver': 'sre-agent',
  'clusterToken': '$CLUSTER_TOKEN',
  'alerts': [{
    'status': 'firing',
    'labels': {
      'alertname': a['alertname'],
      'service': a.get('service','unknown'),
      'severity': a.get('severity','warning'),
      'namespace': 'demo-app'
    },
    'annotations': {
      'summary': a['summary'],
      'description': a['description']
    },
    'startsAt': '$(date -u +%Y-%m-%dT%H:%M:%SZ)',
    'endsAt': '0001-01-01T00:00:00Z'
  }]
}
print(json.dumps(payload))
")

  echo ""
  echo "[$( date '+%H:%M:%S')] Injecting alert: $alertname"
  echo "  → $summary"

  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/webhook/alert" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  if [ "$RESPONSE" = "202" ]; then
    echo "  ✓ Alert accepted (202) — check dashboard at http://localhost:3002"
  else
    echo "  ✗ Failed with HTTP $RESPONSE"
  fi

  INDEX=$(( (INDEX + 1) % ${#ALERTS[@]} ))
}

echo "================================================"
echo "  SRE Alert Injector — firing every 5 minutes"
echo "  Dashboard: http://localhost:3002"
echo "  Press Ctrl+C to stop"
echo "================================================"

# Fire first alert immediately
send_alert

# Then every 5 minutes
while true; do
  echo ""
  echo "  Next alert in ${INTERVAL}s... (Ctrl+C to stop)"
  sleep $INTERVAL
  send_alert
done
