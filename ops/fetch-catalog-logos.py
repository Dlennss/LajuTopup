"""Download original site icons from explicit official brand sites; never synthesize marks."""
import io
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "pulsa-fe"
OVERRIDES = {
    "Sakuku": "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/03/e6/c4/03e6c489-0237-16fe-489a-78e6bcb94b55/AppIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/512x512bb.jpg",
    "MotionPay": "https://storage.googleapis.com/motion-web/navbar_logo/sw1taiDvnl4CDboj4THHobdDI.png",
    "Neo Commerce": "https://www-cms.bankneo.co.id/storage/photos/1/logo/logo_bnc.png",
    "CBN": "https://storage.cybiteam.id/assets.cbn.id/CBN_logo_mobile_1_924aa593b8.png",
    "Bank Banten": "https://www.bankbanten.co.id/assets/uploads/2026/08/1_LOGO-Baru-Bank-Banten_2026.png",
    "Bank NTB": "https://www.bankntbsyariah.co.id/assets/img/favicon.ico",
}
# Visually reviewed: these were hosting, social-network, or publisher marks, not the named brand.
REJECTED = {"myrepublic", "bank mnc", "identity v", "fc mobile", "dragon raja", "tix id", "speed drifters"}
SITES = {
    "Sakuku": "https://apps.apple.com/id/app/sakuku/id965131157",
    "MotionPay": "https://www.motionpay.id/",
    "KasPro": "https://kaspro.id/",
    "Grab": "https://www.grab.com/id/",
    "Maxim": "https://id.taximaxim.com/",
    "Bstation": "https://www.bilibili.tv/",
    "Vidio": "https://www.vidio.com/",
    "WeTV": "https://wetv.vip/",
    "beIN Sports": "https://www.beinsports.com/",
    "TIX ID": "https://www.tix.id/",
    "TIKTOK COINS": "https://www.tiktok.com/",
    "MyRepublic": "https://www.myrepublic.co.id/",
    "First Media": "https://www.firstmedia.com/",
    "CBN": "https://www.cbn.id/",
    "Oxygen": "https://oxygen.id/",
    "GlobalXtreme": "https://www.globalxtreme.net/",
    "Bnetfit": "https://bnetfit.com/",
    "Allo Bank": "https://www.allobank.com/",
    "Bank Aladin Syariah": "https://aladinbank.id/",
    "Bank Jago": "https://www.jago.com/",
    "Blu (BCA Digital)": "https://blubybcadigital.id/",
    "Sea Bank": "https://www.seabank.co.id/",
    "Superbank": "https://www.superbank.id/",
    "Neo Commerce": "https://www.bankneocommerce.co.id/",
    "CIMB Niaga": "https://www.cimbniaga.co.id/",
    "BTN": "https://www.btn.co.id/",
    "BJB": "https://bankbjb.co.id/",
    "Bank Jatim": "https://www.bankjatim.co.id/",
    "Bank Jateng": "https://www.bankjateng.co.id/",
    "Bank DKI": "https://www.bankdki.co.id/",
    "Bank DBS": "https://www.dbs.id/",
    "Maybank": "https://www.maybank.co.id/",
    "Mega": "https://bankmega.com/",
    "Muamalat": "https://www.bankmuamalat.co.id/",
    "OCBC NISP": "https://www.ocbc.id/",
    "Panin": "https://www.panin.co.id/",
    "Sinarmas": "https://www.banksinarmas.com/",
    "UOB": "https://www.uob.co.id/",
    "HSBC": "https://www.hsbc.co.id/",
    "VALORANT": "https://playvalorant.com/",
    "HONKAI STAR RAIL": "https://hsr.hoyoverse.com/",
    "HONKAI IMPACT 3": "https://honkaiimpact3.hoyoverse.com/",
    "ZENLESS ZONE ZERO": "https://zenless.hoyoverse.com/",
    "WUTHERING WAVES": "https://wutheringwaves.kurogames.com/",
    "HAGO": "https://www.hago.sg/",
    "BLOOD STRIKE": "https://www.blood-strike.com/",
    "ZEPETO": "https://zepeto.me/",
    "HONOR OF KING": "https://www.honorofkings.com/",
    "ARENA BREAKOUT": "https://www.arenabreakout.com/",
    "MARVEL RIVALS": "https://www.marvelrivals.com/",
    "MARVEL SNAP": "https://www.marvelsnap.com/",
    "Garena": "https://www.garena.co.id/",
    "MEGAXUS": "https://www.megaxus.com/",
    "GROWTOPIA": "https://www.growtopiagame.com/",
    "8 BALL POOL": "https://8ballpool.com/",
    "POKEMON UNITE": "https://unite.pokemon.com/",
    "LORDS MOBILE": "https://lordsmobile.igg.com/",
    "IDENTITY V": "https://www.identityvgame.com/",
    "Bank Aceh": "https://www.bankaceh.co.id/",
    "Bank Artha Graha": "https://www.arthagraha.com/",
    "Bank Banten": "https://www.bankbanten.co.id/",
    "Bank Bengkulu": "https://www.bankbengkulu.co.id/",
    "Bank Bumi Arta": "https://bankbba.co.id/",
    "Bank Capital": "https://www.bankcapital.co.id/",
    "Bank China Construction": "https://idn.ccb.com/",
    "Bank CTBC": "https://www.ctbcbank.co.id/",
    "Bank DIY": "https://www.bpddiy.co.id/",
    "Bank Ganesha": "https://www.bankganesha.co.id/",
    "Bank Hana": "https://www.hanabank.co.id/",
    "Bank IBK": "https://ibk.co.id/",
    "Bank Ina Perdana": "https://bankina.co.id/",
    "Bank Index": "https://www.bankindex.co.id/",
    "Bank Jambi": "https://www.bankjambi.co.id/",
    "Bank Kalbar": "https://bankkalbar.co.id/",
    "Bank Kalsel": "https://www.bankkalsel.co.id/",
    "Bank Kalteng": "https://www.bankkalteng.co.id/",
    "Bank Kaltim": "https://bankaltimtara.co.id/",
    "Bank Lampung": "https://banklampung.co.id/",
    "Bank MNC": "https://www.mncbank.co.id/",
    "Bank Maluku Malut": "https://www.bankmalukumalut.co.id/",
    "Bank Mandiri Taspen": "https://www.bankmandiritaspen.co.id/",
    "Bank Maspion": "https://www.bankmaspion.co.id/",
    "Bank Mestika": "https://www.bankmestika.co.id/",
    "Bank NTB": "https://www.bankntbsyariah.co.id/",
    "Bank NTT": "https://bpdntt.co.id/",
    "Bank Nagari": "https://banknagari.co.id/",
    "Bank Nobu": "https://www.nobubank.com/",
    "Bank Papua": "https://www.bankpapua.co.id/",
    "Bank QNB": "https://www.qnb.co.id/",
    "Bank Raya (BRI Agro)": "https://bankraya.co.id/",
    "Bank Resona Perdania": "https://www.perdania.co.id/",
    "Bank Riau Kepri": "https://www.brksyariah.co.id/",
    "Bank Sahabat Sampoerna": "https://www.banksampoerna.com/",
    "Bank Shinhan": "https://www.shinhan.co.id/",
    "Bank Sulselbar": "https://banksulselbar.co.id/",
    "Bank Sulteng": "https://banksulteng.co.id/",
    "Bank Sultra": "https://www.banksultra.co.id/",
    "Bank Sulut": "https://www.banksulutgo.co.id/",
    "Bank Sumsel Babel": "https://www.banksumselbabel.com/",
    "Bank Sumut": "https://www.banksumut.co.id/",
    "Bank Victoria": "https://www.victoriabank.co.id/",
    "Bank Woori Saudara": "https://www.bankwoorisaudara.com/",
    "BPD Bali": "https://www.bpdbali.co.id/",
    "Hibank": "https://www.hibank.co.id/",
    "ARENA OF VALOR": "https://aov.garena.co.id/",
    "FC MOBILE": "https://www.ea.com/games/ea-sports-fc/fc-mobile",
    "DELTA FORCE - GARENA": "https://deltaforce.garena.com/",
    "DELTA FORCE - STEAM": "https://www.playdeltaforce.com/",
    "RACING MASTER": "https://www.racingmaster.game/",
    "UNDAWN": "https://ud.garena.com/",
    "FARLIGHT 84": "https://farlight84.farlightgames.com/",
    "METAL SLUG AWAKENING": "https://metalslugawk.com/",
    "AGE OF EMPIRES MOBILE": "https://www.aoemobile.com/",
    "BLACK CLOVER M": "https://bcm.garena.com/",
    "STATE OF SURVIVAL": "https://sos.kingsgroupgames.com/",
    "ONMYOJI ARENA": "https://www.onmyojiarena.us/",
    "SAUSAGE MAN": "https://sausageman.xd.com/",
    "SPEED DRIFTERS": "https://speed.garena.com/",
    "LINEAGE2M": "https://lineage2m.plaync.com/",
    "SUPER SUS": "https://www.supersus.io/",
    "OMEGA LEGENDS": "https://omegalegends.igg.com/",
    "MARVEL SUPER WAR": "https://www.marvelsuperwar.com/",
    "DRAGON RAJA": "https://dragonraja.archosaur.com/",
    "Centrin": "https://www.centrin.net.id/",
    "Comet Internet": "https://www.comet.net.id/",
    "MNC Vision": "https://mncvision.id/",
    "XL Home": "https://www.xlhome.co.id/",
    "WiFi.id": "https://www.wifi.id/",
    "Citibank": "https://www.citibank.co.id/",
    "BTPN": "https://www.smbci.com/",
    "Bukopin": "https://www.kbbank.co.id/",
}

class Icons(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "link" and "icon" in a.get("rel", "").lower() and a.get("href"):
            rank = 0 if "apple-touch" in a.get("rel", "") else 1
            self.links.append((rank, a["href"]))
        if tag == "img" and a.get("src") and "logo" in (a.get("alt", "") + a["src"]).lower():
            self.links.append((3, a["src"]))

def get(url):
    with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=7) as response:
        return response.read(3_000_000), response.geturl()

def main():
    output = ROOT / "public/h2hr-brand-logos"
    output.mkdir(exist_ok=True)
    manifest_path = ROOT / "lib/h2hr-official-logos.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    for key in REJECTED:
        manifest.pop(key, None)
    failures = []
    if len(sys.argv) > 1 and sys.argv[1] == "inspect":
        for name in sys.argv[2:]:
            site = SITES.get(name, name)
            try:
                html, base = get(site)
                parser = Icons()
                parser.feed(html.decode("utf-8", errors="replace"))
                print(json.dumps({"name": name, "url": base, "assets": parser.links[:30]}))
            except Exception as error:
                print(name, type(error).__name__)
        return
    for name, site in SITES.items():
        if len(sys.argv) > 1 and sys.argv[1] == "only" and name not in sys.argv[2:]:
            continue
        key = name.lower()
        if key in REJECTED:
            continue
        if key in manifest and (name not in OVERRIDES or manifest[key]["assetUrl"] == OVERRIDES[name]):
            continue
        try:
            if name in OVERRIDES:
                manifest.pop(key, None)
                candidates = [OVERRIDES[name]]
            else:
                html, base = get(site)
                parser = Icons()
                parser.feed(html.decode("utf-8", errors="replace"))
                candidates = [urljoin(base, href) for _, href in sorted(parser.links)]
                candidates.append(urljoin(base, "/favicon.ico"))
            for url in dict.fromkeys(candidates):
                try:
                    data, final = get(url)
                    slug = "".join(c if c.isalnum() else "-" for c in key).strip("-")
                    if b"<svg" in data[:1000]:
                        svg = ET.fromstring(data)
                        if not svg.tag.endswith("svg") or any(el.tag.endswith(("script", "foreignObject")) for el in svg.iter()):
                            continue
                        filename = f"{slug}.svg"
                        (output / filename).write_bytes(data)
                        manifest[key] = {"src": f"/h2hr-brand-logos/{filename}", "alt": f"Logo {name}", "sourcePage": site, "assetUrl": final}
                        print(f"OK {name} SVG", flush=True)
                        break
                    img = Image.open(io.BytesIO(data))
                    img.verify()
                    if min(img.size) < 16:
                        continue
                    ext = {"PNG": "png", "ICO": "ico", "JPEG": "jpg", "WEBP": "webp", "GIF": "gif"}.get(img.format)
                    if not ext:
                        continue
                    filename = f"{slug}.{ext}"
                    (output / filename).write_bytes(data)
                    manifest[key] = {"src": f"/h2hr-brand-logos/{filename}", "alt": f"Logo {name}", "sourcePage": site, "assetUrl": final}
                    print(f"OK {name} {img.size}", flush=True)
                    break
                except Exception:
                    continue
            else:
                failures.append(name)
        except Exception:
            failures.append(name)
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"downloaded": len(manifest), "unresolved": failures}), flush=True)
    referenced = {Path(item["src"]).name for item in manifest.values()}
    for asset in output.iterdir():
        if asset.is_file() and asset.name not in referenced:
            asset.unlink()

if __name__ == "__main__":
    main()
