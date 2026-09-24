#!/usr/bin/env bash
# Reports a Deployment to project-ops (docs/managed-projects.md in project-ops).
#
#   project-ops.sh register <stage> <kind> <sha> [pr]   prints the deployment id
#   project-ops.sh complete <deployment-id> done [preview-url]
#   project-ops.sh complete <deployment-id> failed
#
# Needs IDP_API_URL, IDP_PROJECT_TOKEN, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET.
set -euo pipefail

call() {
  curl -fsS -X POST "$IDP_API_URL$1" \
    -H "Authorization: Bearer $IDP_PROJECT_TOKEN" \
    -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
    -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
    -H "Content-Type: application/json" \
    -d "$2"
}

case "$1" in
  register)
    payload=$(jq -nc --arg stage "$2" --arg kind "$3" --arg sha "$4" --arg pr "${5:-}" \
      '{stageName: $stage, kind: $kind, commitSha: $sha}
       + (if $pr == "" then {} else {prNumber: ($pr | tonumber)} end)')
    call /v1/deployments "$payload" | jq -r '.deploymentId'
    ;;
  complete)
    payload=$(jq -nc --arg status "$3" --arg url "${4:-}" \
      '{status: $status} + (if $url == "" then {} else {previewUrl: $url} end)')
    call "/v1/deployments/$2/complete" "$payload" >/dev/null
    ;;
  *)
    echo "usage: $0 register|complete ..." >&2
    exit 2
    ;;
esac
