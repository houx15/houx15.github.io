#!/usr/bin/env python3
"""Write a selected runtime secret privately; never accept it as a command-line argument."""
import getpass
import os
from pathlib import Path
import re
import sys
import tempfile

targets = {'model': ('AGENT_MODEL_KEY', 'Bailian API key'), 'turnstile': ('AGENT_TURNSTILE_SECRET', 'Turnstile secret key')}
selection = sys.argv[1] if len(sys.argv) == 2 else 'model' if len(sys.argv) == 1 else None
if selection not in targets:
    raise SystemExit('Usage: set-agent-key.py [model|turnstile]; never pass a key as an argument.')
field, label = targets[selection]

if not sys.stdin.isatty():
    raise SystemExit('Use an interactive SSH terminal; refusing non-interactive secret input.')
path = Path.home() / '.config/portfolio-agent/runtime.env'
if path.is_symlink() or not path.is_file():
    raise SystemExit('Expected the existing private runtime configuration.')
key = getpass.getpass(label + ' (hidden): ').strip()
if not re.fullmatch(r'[A-Za-z0-9._-]{10,512}', key):
    raise SystemExit('Invalid key format; configuration unchanged.')
text = path.read_text()
lines = [line for line in text.splitlines() if not line.startswith(field + '=')]
lines.append(field + '=' + key)
fd, temporary = tempfile.mkstemp(prefix='.runtime-', dir=path.parent)
try:
    with os.fdopen(fd, 'w') as file:
        os.fchmod(file.fileno(), 0o600)
        file.write('\n'.join(lines) + '\n')
        file.flush()
        os.fsync(file.fileno())
    os.replace(temporary, path)
finally:
    if os.path.exists(temporary):
        os.unlink(temporary)
print(label + ' saved privately. Service activation was not changed.')
