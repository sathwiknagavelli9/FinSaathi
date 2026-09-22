"""Reject accidental staging of local secrets or generated directories."""
from pathlib import Path
import re
import subprocess
from dotenv import dotenv_values

values = dotenv_values('.env.local')
secrets = [v for k, v in values.items() if v and k in ['MONGODB_URI', 'JWT_SECRET', 'GROQ_API_KEY', 'VERCEL_OIDC_TOKEN']]
uri = values.get('MONGODB_URI', '')
match = re.search(r'mongodb(?:\+srv)?://[^:]+:([^@]+)@', uri)
if match:
    secrets.append(match.group(1))
files = subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0')
failures = []
for name in filter(None, files):
    if (name.startswith('.env') and name != '.env.example') or any(name.startswith(prefix) for prefix in ['node_modules/', '.next/', '.venv/', '.local/', '.vercel/']) or '__pycache__' in name:
        failures.append(name + ': forbidden tracked path')
    staged = subprocess.check_output(['git', 'show', ':' + name]).decode('utf-8', errors='replace')
    if any(secret in staged for secret in secrets):
        failures.append(name + ': contains a supplied secret')
if failures:
    raise SystemExit('\n'.join(failures))
print(f'PASS: {len(list(filter(None, files)))} tracked/staged files scanned; no supplied secrets or excluded artifacts.')
