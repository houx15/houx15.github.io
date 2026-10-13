#!/usr/bin/env python3
"""Add only the overwritten visitor header; preserve the live Certbot config."""
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time

SITE = Path('/etc/nginx/sites-enabled/portfolio-agent')
HEADER = 'proxy_set_header X-Portfolio-Client-IP $remote_addr;'

def revised(text):
    if len(re.findall(r'server_name\s+agent\.kookat\.icu\s*;', text)) not in (1, 2):
        raise ValueError('Unexpected site: no changes made')
    matches = list(re.finditer(r'location\s+/v2/\s*\{([^{}]*)\}', text))
    if len(matches) != 1:
        raise ValueError('Expected exactly one simple /v2/ location')
    match = matches[0]
    block = match.group(1)
    if not re.search(r'proxy_pass\s+http://127\.0\.0\.1:8788\s*;', block):
        raise ValueError('Unexpected upstream: no changes made')
    existing = re.findall(r'proxy_set_header\s+X-Portfolio-Client-IP\s+([^;]+);', text, re.I)
    if existing:
        if len(existing) == 1 and existing[0].strip() == '$remote_addr' and HEADER in block:
            return text
        raise ValueError('Conflicting visitor header: manual review required')
    return text[:match.start(1)] + '\n        ' + HEADER + block + text[match.end(1):]

def main():
    path = SITE.resolve(strict=True)
    old = path.read_text()
    new = revised(old)
    if new == old:
        print('Visitor header already configured. No changes made.')
        return
    if os.geteuid() != 0:
        raise SystemExit('Administrator privileges required; run this script with sudo.')
    backup = path.with_name(path.name + '.before-visitor-header-' + str(time.time_ns()))
    shutil.copy2(path, backup)
    info = path.stat()
    def replace(text):
        fd, temporary = tempfile.mkstemp(dir=path.parent, prefix='.portfolio-agent-')
        try:
            with os.fdopen(fd, 'w') as handle:
                handle.write(text)
                handle.flush()
                os.fsync(handle.fileno())
            os.chmod(temporary, info.st_mode & 0o777)
            os.chown(temporary, info.st_uid, info.st_gid)
            os.replace(temporary, path)
        finally:
            Path(temporary).unlink(missing_ok=True)
    replace(new)
    try:
        subprocess.run(['nginx', '-t'], check=True)
        subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    except Exception:
        replace(old)
        subprocess.run(['nginx', '-t'], check=True)
        subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
        raise
    print('Visitor header installed; nginx validated and reloaded.')
    print('Backup:', backup)
    print('Backend proxy trust has NOT been enabled by this script.')

if __name__ == '__main__':
    main()
