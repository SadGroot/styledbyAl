#!/usr/bin/env python3
"""Package only the production runtime, public assets, and static browser chunks."""
import pathlib
import tarfile

root = pathlib.Path(__file__).resolve().parent.parent
standalone = root / '.next/standalone'
destination = pathlib.Path('/tmp/styledbyal-release.tar.gz')
if not (standalone / 'server.js').exists():
    raise SystemExit('Run npm run build first.')

def safe(info):
    parts = pathlib.PurePosixPath(info.name).parts
    if any(p.startswith('.env') or p in {'.git', 'OWNER-ACCESS.txt'} for p in parts) or parts[0] == 'data': return None
    return info

with tarfile.open(destination, 'w:gz', compresslevel=3) as archive:
    for name in ['server.js', 'package.json', 'node_modules', '.next']:
        archive.add(standalone / name, arcname=name, filter=safe)
    archive.add(root / 'public', arcname='public', filter=safe)
    archive.add(root / '.next/static', arcname='.next/static', filter=safe)
print(destination)
