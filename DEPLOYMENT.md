# GitHub Actions Deployment

Workflow yang tersedia:

- `.github/workflows/ci.yml`: validasi backend dan frontend saat push atau pull request ke `main`.
- `.github/workflows/deploy.yml`: build artifact Linux ARM64 lalu deploy setelah CI `main` sukses, atau manual dari tab Actions.

Deploy produksi mengikuti konfigurasi khusus LajuTopup di `ops/DEPLOY.md` dan helper server `ops/lajutopup-activate.py`.

## Secrets GitHub

Isi lewat `Settings > Secrets and variables > Actions > Repository secrets`.

Wajib:

- `SERVER_HOST`: host/IP VPS.
- `SERVER_PORT`: port SSH VPS.
- `SERVER_USER`: user SSH deploy.
- `SERVER_SSH_KEY`: private key SSH deploy.
- `BACKEND_SOURCE_DIR`: harus `pulsa-be`.
- `FRONTEND_SOURCE_DIR`: harus `pulsa-fe`.
- `FRONTEND_RELEASE_DIR`: harus `/var/lib/syslog-ng/lajutopup/frontend`.

Workflow deploy akan menolak nilai folder yang tidak sesuai supaya deployment LajuTopup tidak tertukar dengan aplikasi lain.

## Alur

1. CI berjalan untuk `main`.
2. Jika CI sukses, deploy checkout commit yang sama.
3. Backend dibuild sebagai binary Linux ARM64.
4. Frontend dibuild sebagai Next.js standalone.
5. Artifact dikirim ke VPS.
6. Server menjalankan `/usr/local/sbin/lajutopup-activate`.
7. Workflow mengecek `https://lajutopup.com/deploy-version.txt` harus sama dengan commit yang dideploy.

Environment produksi tetap berada di server dan tidak ikut repository.
