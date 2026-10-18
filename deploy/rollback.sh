#!/usr/bin/env bash
set -euo pipefail
previous="$(readlink -f /opt/styledbyal/previous)"
test -f "$previous/server.js"
exec bash /opt/styledbyal/ops/activate.sh "$previous"
