#!/usr/bin/env python3
"""Briefly quiesce writes, hard-link a media snapshot, then compress after restart."""
import os
import pathlib
import shutil
import sqlite3
import subprocess
import tarfile
import tempfile
from lifecycle import app_lock

root = pathlib.Path('/var/lib/styledbyal')
backups = root / 'backups'
backups.mkdir(mode=0o700, exist_ok=True)
total = sum(p.stat().st_size for p in (root / 'media').iterdir() if p.is_file())
if shutil.disk_usage(root).free < total * 1.1 + 1024**3:
    raise SystemExit('Insufficient space to replace the backup while preserving the 1 GB reserve.')
with tempfile.TemporaryDirectory(prefix='snapshot-', dir=backups) as temporary:
    snapshot = pathlib.Path(temporary)
    with app_lock():
        subprocess.run(['systemctl', 'stop', 'styledbyal'], check=True)
        try:
            source = sqlite3.connect(root / 'styledbyal.db')
            destination = sqlite3.connect(snapshot / 'database.sqlite')
            source.backup(destination)
            if destination.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise RuntimeError('Database integrity check failed.')
            destination.close()
            source.close()
            shutil.copytree(root / 'media', snapshot / 'media', copy_function=os.link)
        finally:
            subprocess.run(['systemctl', 'start', 'styledbyal'], check=True)
    archive = backups / 'next.tar.gz'
    try:
        with tarfile.open(archive, 'w:gz', compresslevel=1) as tar:
            tar.add(snapshot / 'database.sqlite', arcname='database.sqlite')
            tar.add(snapshot / 'media', arcname='media')
        os.chmod(archive, 0o600)
        archive.replace(backups / 'latest.tar.gz')
    finally:
        archive.unlink(missing_ok=True)
print('Consistent database and media backup saved to /var/lib/styledbyal/backups/latest.tar.gz')
