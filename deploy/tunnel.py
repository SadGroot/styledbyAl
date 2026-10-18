#!/usr/bin/env python3
"""Supervise a Quick Tunnel and keep the application's trusted origin in sync."""
import os
import pathlib
import re
import subprocess
import sys
from lifecycle import app_lock

environment = pathlib.Path('/etc/styledbyal/app.env')
process = subprocess.Popen([
    '/usr/sbin/runuser', '-u', 'styledbyal', '--', '/usr/local/bin/cloudflared',
    'tunnel', '--no-autoupdate', '--protocol', 'http2', '--edge-ip-version', '4', '--url', 'http://127.0.0.1:3000',
], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
try:
    for line in process.stdout:
        print(line.rstrip(), flush=True)
        match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
        if match:
            with app_lock():
                url = match.group(0)
                entries = [entry for entry in environment.read_text().splitlines() if not entry.startswith('SITE_URL=')]
                temporary = environment.with_suffix('.tmp')
                temporary.write_text('\n'.join(entries + ['SITE_URL=' + url]) + '\n')
                os.chmod(temporary, 0o640)
                import grp
                os.chown(temporary, 0, grp.getgrnam('styledbyal').gr_gid)
                temporary.replace(environment)
                subprocess.run(['systemctl', 'restart', 'styledbyal.service'], check=True)
                pathlib.Path('/var/lib/styledbyal/preview-url').write_text(url + '\n')
                print('Preview origin synchronized: ' + url, flush=True)
    sys.exit(process.wait())
finally:
    if process.poll() is None:
        process.terminate()
