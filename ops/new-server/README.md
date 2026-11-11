# New LajuTopup Server

Origin: `103.31.39.97`, domain: `https://lajutopup.com`.
Source: `/home/mitra-p24/hit/LajuTopup`.

| Component | Service | Address |
| --- | --- | --- |
| Frontend | `lajutopup-fe` | `127.0.0.1:3106` |
| Backend | `lajutopup-be` | `127.0.0.1:8106` |
| PostgreSQL | existing PostgreSQL instance | database `lajutopup`, role `lajutopup_app` |

The application services run as the dedicated Linux user `lajutopup`.
Server-owned secrets live in `/etc/lajutopup/backend.env` and
`/etc/lajutopup/frontend.env`, readable only by root. Systemd loads them.
Provider credentials and payment gateways have not been configured on this host.
The catalog comes from the repository snapshot; verify current provider pricing
before enabling purchases. The database was created empty at the owner's request.

Nginx configuration: `/etc/nginx/sites-available/lajutopup.com`.
The original 503 configuration is backed up at
`/etc/nginx/lajutopup-backup-SE4Pyjx3`.
AbsensiP24 configuration and services are independent and were not modified.

`provision.py init` refuses an existing configuration, database, or role.
`provision.py schema` applies the fresh bootstrap and compatible migrations,
recording completed files in `deployment_schema_history`. It intentionally skips
legacy product seeds and migrations already incorporated into the bootstrap.
Backend startup seeds the Pulsa24Jam catalog.

`verify.py` checks the origin using production TLS, static assets, registration,
login cookies, protected pages, and the GoPay catalog. It creates a temporary
zero-balance member and deletes that member afterward. It makes no purchases.

Check deployment health:

```sh
systemctl is-active lajutopup-fe lajutopup-be absensip24-api
curl --fail http://127.0.0.1:8106/health
nginx -t
python3 /home/mitra-p24/hit/LajuTopup/ops/new-server/verify.py
```

GitHub now builds Linux x86-64 releases and activates them through the dedicated
`lajutopup-deploy` account. See [../DEPLOY.md](../DEPLOY.md) for the release layout,
secrets, verification, and rollback behavior. The source directory remains the
persistent backend working directory; running frontend code comes from the
selected release after the first Actions deployment.
