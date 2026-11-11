# LajuTopup Deployment

The GitHub workflow builds on `ubuntu-24.04` for Linux amd64, using Node 22.
Artifacts are uploaded over verified SSH to `/home/lajutopup-deploy/incoming`.
This account can run only `/usr/local/sbin/lajutopup-activate` without arguments
through sudo. It cannot change Nginx, other applications, or systemd unit files.

The root-owned helper is installed from `ops/lajutopup-activate.py`.
Changes to this helper require reviewed installation by a server administrator;
the deployment account cannot replace it.

Releases are stored beneath:

```text
/home/mitra-p24/hit/LajuTopup/deployment/releases/<commit>-<timestamp>/
  DEPLOY_COMMIT
  backend/lajutopup-api
  frontend/server.js
  frontend/.next/
  frontend/public/
```

Activation uses a deployment lock, validates the archive checksum, paths,
architecture, and matching frontend version, and updates only these drop-ins:

- `/etc/systemd/system/lajutopup-be.service.d/release.conf`
- `/etc/systemd/system/lajutopup-fe.service.d/release.conf`

Backend: `127.0.0.1:8106`. Frontend: `127.0.0.1:3106`.
Both run as the Linux user `lajutopup`. Persistent backend uploads remain in
`/home/mitra-p24/hit/LajuTopup/pulsa-be/uploads` because its working directory
does not change between releases. Each frontend release has a writable cache.
Environment files remain `/etc/lajutopup/backend.env` and `frontend.env`.

The helper restarts both services and checks local health, catalog access, and
the deployed commit. If these fail, it restores the previous drop-ins and
restarts the previous code. The workflow then checks the public commit marker:

```text
https://lajutopup.com/deploy-version.txt
```

Rollback restores application code, not database changes. Future schema changes
need a reviewed migration and database backup; the workflow does not run the
fresh-database provisioning script. Existing catalog startup synchronization
remains part of the backend. Retain earlier release folders for rollback and
review disk usage periodically before removing unused releases.

AbsensiP24 stays on its own Nginx configuration and backend port `8200`.
No deployment step changes it or reloads shared Nginx.

## Verification

```sh
python3 -m unittest discover -s ops -p 'test_*.py' -v
systemctl is-active lajutopup-be lajutopup-fe absensip24-api
curl --fail http://127.0.0.1:8106/health
curl --fail http://127.0.0.1:3106/deploy-version.txt
journalctl -u lajutopup-be -u lajutopup-fe -n 50 --no-pager
```

For initial server setup, see [new-server/README.md](new-server/README.md).
