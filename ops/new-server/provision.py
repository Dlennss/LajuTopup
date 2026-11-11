"""Provision only a new, isolated LajuTopup database on the new host."""
import os
from pathlib import Path
import secrets
import subprocess
import sys

ROOT = Path('/home/mitra-p24/hit/LajuTopup')
CONFIG = Path('/etc/lajutopup')


def sql(query, database='postgres', app_role=False):
    if app_role:
        query = 'SET ROLE lajutopup_app;\n' + query
    result = subprocess.run(
        ['runuser', '-u', 'postgres', '--', 'psql', '-X', '-qAt',
         '-v', 'ON_ERROR_STOP=1', '-d', database],
        input=query, text=True, capture_output=True, check=False,
    )
    if result.returncode:
        raise RuntimeError(result.stderr)
    return result.stdout.strip()


def init():
    if CONFIG.exists():
        raise RuntimeError('Configuration already exists; refusing to replace secrets')
    if sql("SELECT 1 FROM pg_database WHERE datname='lajutopup'"):
        raise RuntimeError('Database already exists; refusing to overwrite')
    if sql("SELECT 1 FROM pg_roles WHERE rolname='lajutopup_app'"):
        raise RuntimeError('Database role already exists; refusing to overwrite')
    CONFIG.mkdir(mode=0o700)
    password = secrets.token_hex(32)
    session_secret = secrets.token_hex(48)
    admin_token = secrets.token_hex(48)
    configs = {
        'backend.env': {
            'DATABASE_URL': f'postgres://lajutopup_app:{password}@127.0.0.1:5432/lajutopup?sslmode=disable',
            'HOST': '127.0.0.1', 'PORT': '8106',
            'CORS_ORIGINS': 'https://lajutopup.com',
            'JWT_SECRET': secrets.token_hex(48), 'ADMIN_TOKEN': admin_token,
            'PULSA24JAM_CATALOG_SEED_AUTO_SYNC': 'true',
        },
        'frontend.env': {
            'NODE_ENV': 'production', 'HOSTNAME': '127.0.0.1', 'PORT': '3106',
            'API_BASE': 'http://127.0.0.1:8106',
            'NEXTAUTH_URL': 'https://lajutopup.com',
            'NEXT_PUBLIC_SITE_URL': 'https://lajutopup.com',
            'NEXTAUTH_SECRET': session_secret, 'AUTH_SECRET': session_secret,
            'ADMIN_TOKEN': admin_token,
            'GOOGLE_LOGIN_ENABLED': 'false',
        },
    }
    for name, values in configs.items():
        path = CONFIG / name
        path.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
        path.chmod(0o600)
    sql(f"CREATE ROLE lajutopup_app LOGIN PASSWORD '{password}' NOSUPERUSER NOCREATEDB NOCREATEROLE;")
    sql('CREATE DATABASE lajutopup OWNER lajutopup_app;')
    sql('REVOKE ALL ON DATABASE lajutopup FROM PUBLIC;')
    (CONFIG / 'fresh-database').touch(mode=0o600)
    print('Isolated database and protected environment files created')


def schema():
    if not (CONFIG / 'fresh-database').is_file():
        raise RuntimeError('Missing fresh database marker')
    sql('CREATE TABLE IF NOT EXISTS deployment_schema_history (name text PRIMARY KEY);',
        'lajutopup', True)
    files = [
        '00000000_local_bootstrap_full_schema.sql',
        '20260320_create_bank_tables.sql',
    ]
    files += [p.name for p in sorted((ROOT / 'pulsa-be/sql').glob('*.sql'))
              if '20260715' <= p.name < '20260900'
              and '_seed_' not in p.name
              and p.name not in (
                  # The fresh bootstrap already contains these final schemas.
                  '20260715_fix_app_ads_schema.sql',
                  '20260715_fix_retail_schema.sql',
                  '20260811_remove_fake_bca_operational_opening_balance.sql',
                  '20260811_submit_existing_deposit_tickets_for_admin_review.sql',
              )]
    applied = set(sql('SELECT name FROM deployment_schema_history;', 'lajutopup', True).splitlines())
    for name in files:
        if name in applied:
            continue
        query = (ROOT / 'pulsa-be/sql' / name).read_text()
        sql(query, 'lajutopup', True)
        sql(f"INSERT INTO deployment_schema_history VALUES ('{name}');", 'lajutopup', True)
        print('Applied ' + name, flush=True)


if __name__ == '__main__':
    os.umask(0o077)
    if sys.argv[1:] == ['init']:
        init()
    elif sys.argv[1:] == ['schema']:
        schema()
    else:
        raise SystemExit('Usage: provision.py init|schema')
