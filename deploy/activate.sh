#!/usr/bin/env bash
set -euo pipefail
release="${1:?Provide the absolute release directory}"
test -f "$release/server.js"
exec 9>/var/lib/styledbyal/.lifecycle.lock
flock 9
previous="$(readlink -f /opt/styledbyal/current 2>/dev/null || true)"
if [ -n "$previous" ]; then ln -sfn "$previous" /opt/styledbyal/previous; fi
mkdir -p "$release/.next"
ln -sfn /var/lib/styledbyal/cache "$release/.next/cache"
ln -sfn "$release" /opt/styledbyal/current
systemctl restart styledbyal
ready=false
for attempt in {1..30}; do
  if /usr/bin/python3 -c 'import urllib.request; urllib.request.urlopen("http://127.0.0.1:3000/api/health",timeout=3)' 2>/dev/null; then ready=true; break; fi
  sleep 1
done
if [ "$ready" != true ]; then
  if [ -n "$previous" ]; then ln -sfn "$previous" /opt/styledbyal/current; systemctl restart styledbyal; fi
  echo 'Release health check failed; previous release restored when available.' >&2
  exit 1
fi
echo 'Release activated and health checked.'
