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

## H2HR Catalog

The 2026-11-11 seed contains 15,297 products from the account's H2HR export:
6,564 fixed-price products and 8,733 open-amount products. SKU, name, group,
category, brand, and price were compared against the authenticated PRODUK API.
For open amounts the catalog price is the service fee, not the top-up amount.
The backend refreshes the catalog every 15 minutes when configured. Invalid or
duplicate rows abort the whole synchronization; the previous catalog remains.

Generate a replacement seed with `go run ./scripts/pulsa24jam_catalog_from_dashboard
<export.txt> <output.sql> [comparison.json]` from `pulsa-be`, then update the
embedded path in `catalog_seed.go`. The importer checks the declared totals.

Production credentials stay in `/etc/lajutopup/backend.env`. A new database must
use a unique, persistent `PULSA24JAM_APP_REF_NAMESPACE`; never change it while
transactions are pending. The authenticated callback URL is stored privately at
`/etc/lajutopup/p24-callback-url.txt`; configure that URL in the H2HR dashboard
before live purchases. Do not commit or publish it.

Bill-payment categories remain visible, but checkout is blocked without a valid
provider inquiry. The dashboard export contains service fees only, so it cannot
establish the customer's bill total or a correct inquiry/payment SKU pair.

Original brand assets and their sources are recorded in
`pulsa-fe/lib/h2hr-official-logos.json`. Unverified marks use a neutral icon,
not an invented corporate logo. `ops/fetch-catalog-logos.py` requires Pillow;
downloaded candidates must be visually reviewed before committing.
`ops/check-catalog-ui.cjs` checks mobile/desktop navigation, image loading,
overflow and checkout without sending a purchase. Set `PLAYWRIGHT_MODULE` when
Playwright is installed outside the workspace.
