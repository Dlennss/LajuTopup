#!/usr/bin/python3
"""Activate an isolated x86-64 release, restoring both services on failure."""
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import tempfile
import time
import urllib.request

BASE = Path('/home/mitra-p24/hit/LajuTopup/deployment')
STAGE = Path('/home/lajutopup-deploy/incoming')
SYSTEMD = Path('/etc/systemd/system')
UNITS = ('lajutopup-be', 'lajutopup-fe')


def run(*args):
    subprocess.run(args, check=True)


def fetch(url):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(url, timeout=5) as response:
        return response.read().decode()


def validate_release(release):
    commit = (release / 'DEPLOY_COMMIT').read_text().strip()
    if not re.fullmatch('[0-9a-f]{40}', commit):
        raise ValueError('Invalid release commit')
    for name in ('server.js', '.next/BUILD_ID', 'public/deploy-version.txt'):
        if not (release / 'frontend' / name).is_file():
            raise ValueError('Incomplete frontend: ' + name)
    if (release / 'frontend/public/deploy-version.txt').read_text().strip() != commit:
        raise ValueError('Frontend version does not match release')
    with (release / 'backend/lajutopup-api').open('rb') as binary:
        header = binary.read(20)
    if header[:6] != b'\x7fELF\x02\x01' or header[18:20] != b'\x3e\x00':
        raise ValueError('Backend must be Linux x86-64')
    return commit


def unpack(archive, destination):
    with tarfile.open(archive, 'r:gz') as package:
        members = package.getmembers()
        if len(members) > 50000 or sum(item.size for item in members) > 2_000_000_000:
            raise ValueError('Release exceeds size limit')
        for item in members:
            parts = Path(item.name).parts
            if not parts or parts[0] not in ('frontend', 'backend', 'DEPLOY_COMMIT'):
                raise ValueError('Unexpected archive path')
            if any(part == '.env' or part.startswith('.env.') for part in parts):
                raise ValueError('Environment files must stay on the server')
        package.extractall(destination, filter='data')


def healthy(commit):
    for _ in range(30):
        try:
            if (fetch('http://127.0.0.1:8106/health').strip() == 'OK'
                    and fetch('http://127.0.0.1:3106/deploy-version.txt').strip() == commit):
                fetch('http://127.0.0.1:3106/')
                fetch('http://127.0.0.1:8106/v1/app/kategori')
                return True
        except (OSError, ValueError):
            pass
        time.sleep(2)
    return False


def activate(release, commit):
    overrides = {
        'lajutopup-be': '[Service]\nExecStart=\nExecStart=' + str(release / 'backend/lajutopup-api') + '\n',
        'lajutopup-fe': '[Service]\nWorkingDirectory=' + str(release / 'frontend') + '\n',
    }
    previous = {}
    try:
        for unit, content in overrides.items():
            dropin = SYSTEMD / (unit + '.service.d/release.conf')
            previous[dropin] = dropin.read_bytes() if dropin.exists() else None
            dropin.parent.mkdir(exist_ok=True)
            dropin.write_text(content)
            dropin.chmod(0o644)
        run('systemctl', 'daemon-reload')
        run('systemctl', 'restart', *UNITS)
        if not healthy(commit):
            raise RuntimeError('Release health check failed')
    except Exception:
        for dropin, old in previous.items():
            if old is None:
                dropin.unlink(missing_ok=True)
            else:
                dropin.write_bytes(old)
        run('systemctl', 'daemon-reload')
        run('systemctl', 'restart', *UNITS)
        print('Previous LajuTopup service configuration restored', flush=True)
        raise


def main():
    import fcntl
    os.umask(0o022)
    with open('/run/lock/lajutopup-deploy.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        expected = (STAGE / 'release.sha256').read_text().split()[0]
        if not re.fullmatch('[0-9a-f]{64}', expected):
            raise ValueError('Invalid archive checksum')
        with tempfile.TemporaryDirectory(prefix='verify-', dir=BASE) as temp:
            archive = Path(temp) / 'release.tar.gz'
            descriptor = os.open(STAGE / 'release.tar.gz', os.O_RDONLY | os.O_NOFOLLOW)
            with os.fdopen(descriptor, 'rb') as source, archive.open('wb') as output:
                if os.fstat(source.fileno()).st_size > 500_000_000:
                    raise ValueError('Archive exceeds upload size limit')
                shutil.copyfileobj(source, output)
            with archive.open('rb') as source:
                actual = hashlib.file_digest(source, 'sha256').hexdigest()
            if actual != expected:
                raise ValueError('Uploaded archive checksum mismatch')
            candidate = Path(temp) / 'candidate'
            candidate.mkdir()
            unpack(archive, candidate)
            commit = validate_release(candidate)
            release = BASE / 'releases' / (commit[:12] + '-' + str(time.time_ns()))
            candidate.rename(release)
        for path in release.rglob('*'):
            if not path.is_symlink():
                path.chmod(0o755 if path.is_dir() or path.stat().st_mode & 0o111 else 0o644)
        (release / 'backend/lajutopup-api').chmod(0o755)
        cache = release / 'frontend/.next/cache'
        if cache.is_symlink():
            raise ValueError('Cache directory must not be a symlink')
        cache.mkdir(exist_ok=True)
        shutil.chown(cache, user='lajutopup', group='lajutopup')
        activate(release, commit)
        print('LajuTopup active: ' + commit, flush=True)


if __name__ == '__main__':
    main()
