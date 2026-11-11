# Update LajuTopup

Push changes to `main`. GitHub runs **CI**, then **Deploy** after CI succeeds.
Follow progress at https://github.com/Dlennss/LajuTopup/actions.

To redeploy the latest `main` manually, open **Actions > Deploy > Run workflow**
and select `main`. Pull requests and other branches cannot deploy production.
Superseded commits are skipped or rejected before activation.

Production: https://lajutopup.com on `103.31.39.97`.
GitHub builds Linux x86-64 artifacts; the production server does not build them.
Each release has its own folder and a SHA-256 transfer check. Activation verifies
the backend, frontend, catalog endpoint, and commit marker. A failed local health
check restores the previous configuration of both LajuTopup services.

Repository secrets configured for this deployment:

- `LAJUTOPUP_DEPLOY_KEY`: private key for `lajutopup-deploy`.
- `LAJUTOPUP_KNOWN_HOSTS`: verified SSH host key for `103.31.39.97`.

The legacy `SERVER_*`, `BACKEND_SOURCE_DIR`, `FRONTEND_SOURCE_DIR`, and
`FRONTEND_RELEASE_DIR` secrets are no longer used. Runtime credentials remain in
`/etc/lajutopup/` on the server and are never included in the release archive.

See [server details](ops/DEPLOY.md) for service paths and recovery.
