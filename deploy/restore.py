#!/usr/bin/env python3
import argparse
import grp
import os
import pathlib
import pwd
import shutil
import sqlite3
import subprocess
import tarfile
import tempfile
from lifecycle import app_lock

parser = argparse.ArgumentParser(description='Verify or restore a Styled by Al backup.')
parser.add_argument('archive')
parser.add_argument('--verify-only', action='store_true')
args = parser.parse_args()
root = pathlib.Path('/var/lib/styledbyal')
with tempfile.TemporaryDirectory(prefix='restore-', dir=root) as temporary:
    restored = pathlib.Path(temporary)
    with tarfile.open(args.archive, 'r:gz') as archive:
        for member in archive.getmembers():
            if member.issym() or member.islnk() or pathlib.PurePosixPath(member.name).is_absolute() or '..' in pathlib.PurePosixPath(member.name).parts:
                raise SystemExit('Unsafe archive member.')
        archive.extractall(restored, filter='data')
    connection = sqlite3.connect(restored / 'database.sqlite')
    if connection.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
        raise SystemExit('The database integrity check failed.')
    connection.close()
    if not (restored / 'media').is_dir():
        raise SystemExit('The backup does not contain media.')
    if args.verify_only:
        print('Backup extracted and database integrity verified. Live content was not changed.')
    else:
        with app_lock():
            subprocess.run(['systemctl', 'stop', 'styledbyal'], check=True)
            try:
                (root / 'styledbyal.db-wal').unlink(missing_ok=True)
                (root / 'styledbyal.db-shm').unlink(missing_ok=True)
                os.replace(restored / 'database.sqlite', root / 'styledbyal.db')
                old_media = root / 'media-before-restore'
                if old_media.exists(): shutil.rmtree(old_media)
                (root / 'media').rename(old_media)
                (restored / 'media').rename(root / 'media')
                uid, gid = pwd.getpwnam('styledbyal').pw_uid, grp.getgrnam('styledbyal').gr_gid
                os.chown(root / 'styledbyal.db', uid, gid)
                for directory, _, files in os.walk(root / 'media'):
                    os.chown(directory, uid, gid)
                    for name in files: os.chown(pathlib.Path(directory) / name, uid, gid)
                shutil.rmtree(old_media)
            finally:
                subprocess.run(['systemctl', 'start', 'styledbyal'], check=True)
        print('Database and media restored.')
