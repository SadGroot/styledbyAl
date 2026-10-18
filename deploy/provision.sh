#!/usr/bin/env bash
set -euo pipefail
id styledbyal >/dev/null 2>&1 || useradd --system --home /var/lib/styledbyal --shell /usr/sbin/nologin styledbyal
install -d -m 755 /opt/styledbyal/releases /opt/styledbyal/ops
install -d -m 750 -o styledbyal -g styledbyal /var/lib/styledbyal /var/lib/styledbyal/media /var/lib/styledbyal/cache
install -d -m 700 /var/lib/styledbyal/backups
install -d -m 750 -o root -g styledbyal /etc/styledbyal
install -m 644 /opt/styledbyal/ops/styledbyal.service /etc/systemd/system/styledbyal.service
install -m 644 /opt/styledbyal/ops/styledbyal-tunnel.service /etc/systemd/system/styledbyal-tunnel.service
install -m 644 /opt/styledbyal/ops/styledbyal-backup.service /etc/systemd/system/styledbyal-backup.service
install -m 644 /opt/styledbyal/ops/styledbyal-backup.timer /etc/systemd/system/styledbyal-backup.timer
systemctl daemon-reload
systemctl enable styledbyal.service styledbyal-tunnel.service styledbyal-backup.timer
