# LajuTopup deployment

GitHub Actions builds Linux ARM64 artifacts and uploads using SERVER_HOST,
SERVER_PORT, SERVER_USER and SERVER_SSH_KEY secrets. Source folders are
pulsa-fe and pulsa-be relative to the checkout, not absolute server paths.

The syslog-ng SSH account has home /var/lib/syslog-ng, which is root-owned.
The server administrator must provision only ~/lajutopup and its frontend and
pulsa-be subdirectories with ownership syslog-ng:syslog-ng and mode 0755.
Do not change ownership of the entire home or shared application directory.

Staging:
- ~/lajutopup/frontend
- ~/lajutopup/pulsa-be/lajutopup-api

Install ops/lajutopup-activate.py as root-owned mode 0755
/usr/local/sbin/lajutopup-activate. Allow syslog-ng to run only this no-argument
command with passwordless sudo. The helper expects the existing lajutopup-fe and
lajutopup-be systemd units and their separate server-owned environment files.
It snapshots both artifacts into deployment/lajutopup/releases, switches only
these two services, and rolls back if local health/version checks fail.
The deployment job also verifies the exact commit through the public domain.

Frontend listens on 172.22.0.1:33032; backend on 127.0.0.1:8106.
Nginx Proxy Manager routes lajutopup.com to the frontend. Production environment
files stay under /var/lib/syslog-ng/fadlanpulsa/deployment/lajutopup; never upload
or commit them. Do not point another application's deployment at these paths.

Push main triggers deployment. Directory secrets are validated against LajuTopup-only paths before deployment.
FRONTEND_RELEASE_DIR must be /var/lib/syslog-ng/lajutopup/frontend. Credentials remain in server env files.
