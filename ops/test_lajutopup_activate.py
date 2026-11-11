import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('activate', Path(__file__).with_name('lajutopup-activate.py'))
activate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(activate)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.release = self.root / 'release'
        for folder in ('frontend/.next', 'frontend/public', 'backend'):
            (self.release / folder).mkdir(parents=True, exist_ok=True)
        self.commit = 'a' * 40
        (self.release / 'DEPLOY_COMMIT').write_text(self.commit)
        (self.release / 'frontend/public/deploy-version.txt').write_text(self.commit)
        (self.release / 'frontend/server.js').write_text('')
        (self.release / 'frontend/.next/BUILD_ID').write_text('build')
        self.binary = self.release / 'backend/lajutopup-api'
        self.binary.write_bytes(b'\x7fELF\x02\x01' + b'\0' * 12 + b'\x3e\x00')

    def test_accepts_matching_x64_release(self):
        self.assertEqual(activate.validate_release(self.release), self.commit)

    def test_rejects_old_arm64_artifact(self):
        self.binary.write_bytes(self.binary.read_bytes()[:18] + b'\xb7\x00')
        with self.assertRaisesRegex(ValueError, 'x86-64'):
            activate.validate_release(self.release)

    def test_rejects_mixed_frontend_backend_release(self):
        (self.release / 'frontend/public/deploy-version.txt').write_text('b' * 40)
        with self.assertRaisesRegex(ValueError, 'does not match'):
            activate.validate_release(self.release)

    def test_failed_health_restores_existing_and_absent_dropins(self):
        systemd = self.root / 'systemd'
        old = systemd / 'lajutopup-fe.service.d/release.conf'
        old.parent.mkdir(parents=True)
        original = b'[Service]\nWorkingDirectory=/previous/frontend\n'
        old.write_bytes(original)
        with patch.object(activate, 'SYSTEMD', systemd), \
                patch.object(activate, 'run') as run, \
                patch.object(activate, 'healthy', return_value=False):
            with self.assertRaisesRegex(RuntimeError, 'health check failed'):
                activate.activate(self.release, self.commit)
        self.assertEqual(old.read_bytes(), original)
        self.assertFalse((systemd / 'lajutopup-be.service.d/release.conf').exists())
        restarts = [call.args for call in run.call_args_list if 'restart' in call.args]
        self.assertEqual(restarts, [('systemctl', 'restart', *activate.UNITS)] * 2)

    def test_success_keeps_new_release(self):
        systemd = self.root / 'systemd'
        systemd.mkdir()
        with patch.object(activate, 'SYSTEMD', systemd), \
                patch.object(activate, 'run'), \
                patch.object(activate, 'healthy', return_value=True):
            activate.activate(self.release, self.commit)
        self.assertIn(str(self.release / 'frontend'),
                      (systemd / 'lajutopup-fe.service.d/release.conf').read_text())


if __name__ == '__main__':
    unittest.main()
