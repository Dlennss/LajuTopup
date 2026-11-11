"""Run as root on the LajuTopup host. Never sends a PAY request."""
import datetime
import json
import os
from pathlib import Path
import secrets
import pwd
import subprocess
import sys
import urllib.request

ENV = Path("/etc/lajutopup/backend.env")
PENDING = Path("/etc/lajutopup/p24-credentials-pending.json")

def backup():
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    folder = Path("/root/lajutopup-backups") / stamp
    folder.mkdir(parents=True, mode=0o700)
    with (folder / "database.dump").open("wb") as file:
        subprocess.run(["runuser", "-u", "postgres", "--", "pg_dump", "-Fc", "lajutopup"], stdout=file, check=True)
    (folder / "backend.env").write_bytes(ENV.read_bytes())
    print("Backup:", folder)

def activate():
    credentials = json.loads(PENDING.read_text())
    key = credentials.get("api_key") or credentials.get("key")
    pin = credentials.get("pin")
    if not key or not pin:
        raise RuntimeError("Missing provider key or PIN; no configuration changed")
    data = {}
    for line in ENV.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            name, value = line.split("=", 1)
            data[name] = value
    data.update({
        "PULSA24JAM_BASE_URL": "https://api.pulsa24jam.net/v2/trx",
        "PULSA24JAM_MEMBERID": "2581",
        "PULSA24JAM_API_KEY": str(key),
        "PULSA24JAM_PIN": str(pin),
        "PULSA24JAM_PRODUCT_SYNC_INTERVAL": "15m",
        "PULSA24JAM_APP_REF_NAMESPACE": data.get("PULSA24JAM_APP_REF_NAMESPACE") or secrets.token_hex(16),
        "PULSA24JAM_CALLBACK_TOKEN": data.get("PULSA24JAM_CALLBACK_TOKEN") or secrets.token_hex(32),
        "PULSA_LOG_DIR": "/var/log/lajutopup",
    })
    logdir = Path(data["PULSA_LOG_DIR"])
    logdir.mkdir(mode=0o750, exist_ok=True)
    account = pwd.getpwnam("lajutopup")
    os.chown(logdir, account.pw_uid, account.pw_gid)
    if any("\n" in v or "\r" in v for v in data.values()):
        raise RuntimeError("Invalid multiline environment value")
    target = ENV.with_suffix(".new")
    target.write_text("\n".join(f"{k}={v}" for k, v in data.items()) + "\n")
    target.chmod(0o600)
    target.replace(ENV)
    Path("/etc/lajutopup/p24-callback-url.txt").write_text("https://lajutopup.com/v1/webhook/pulsa24jam?token=" + data["PULSA24JAM_CALLBACK_TOKEN"] + "\n")
    subprocess.run(["systemctl", "restart", "lajutopup-be"], check=True)
    print("Provider configured; backend restarted. No payment sent.")

def verify():
    with urllib.request.urlopen("http://127.0.0.1:8106/v1/app/produk", timeout=60) as response:
        products = json.load(response)["items"]
    live = json.loads(Path("/etc/lajutopup/p24-catalog-live.json").read_text())["items"]
    expected = {p["sku"]: p for p in live}
    actual = {p["sku"]: p for p in products}
    errors = []
    for sku, p in expected.items():
        row = actual.get(sku, {})
        for field in ("nama", "kategori_nama", "brand_nama", "tipe_harga", "group_name"):
            if str(row.get(field, "")).casefold() != str(p.get(field, "")).casefold():
                errors.append(f"{sku}: {field}")
        if row.get("harga_dasar_app") != p.get("harga", p.get("fee_tambahan")):
            errors.append(f"{sku}: price")
        for role in ("master", "agent", "user", "guest"):
            if row.get(f"harga_{role}_final") != p.get("harga", p.get("fee_tambahan")):
                errors.append(f"{sku}: {role} price")
    extra = sorted(set(actual) - set(expected))
    print(json.dumps({"catalog": len(products), "expected": len(live), "extra": extra[:10], "mismatches": len(errors), "examples": errors[:10]}))
    if errors or extra or len(products) != len(live):
        raise RuntimeError("Catalog does not match provider")
    print("All SKUs, names, categories, brands, price types and prices match.")

if __name__ == "__main__":
    os.umask(0o077)
    {"backup": backup, "activate": activate, "verify": verify}[sys.argv[1]]()
