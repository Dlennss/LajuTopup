"""Smoke-test the new deployment using a disposable, zero-balance member."""
import http.cookiejar
from html.parser import HTMLParser
import json
import secrets
import socket
import subprocess
import urllib.error
import urllib.parse
import urllib.request

BASE = 'https://lajutopup.com'
# Exercise the origin with the production Host/SNI and secure cookies.
resolve = socket.getaddrinfo
socket.getaddrinfo = lambda host, *args, **kwargs: resolve(
    '127.0.0.1' if host == 'lajutopup.com' else host, *args, **kwargs)
email = f'deploy-check-{secrets.token_hex(8)}@example.invalid'
password = secrets.token_hex(24)
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def request(path, data=None, token=None):
    body = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(BASE + path, data=body,
                                 headers={'Content-Type': 'application/json'})
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    try:
        with opener.open(req, timeout=25) as response:
            return response.status, response.geturl(), response.read().decode()
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'{path}: HTTP {error.code}, {error.read().decode()[:300]}') from None


class Assets(HTMLParser):
    paths = set()

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ('src', 'href') and value and value.startswith('/_next/static/'):
                self.paths.add(value)


try:
    status, _, html = request('/')
    assert status == 200 and 'LajuTopup' in html
    assets = Assets()
    assets.feed(html)
    assert assets.paths
    for path in assets.paths:
        assert request(path)[0] == 200
    print(f'Home and {len(assets.paths)} static assets: OK', flush=True)
    registered = json.loads(request('/api/auth/register', {
        'email': email, 'nama': 'Deployment Verification',
        'phone': '080000000000', 'password': password,
    })[2])
    assert registered.get('ok'), registered
    logged_in = json.loads(request('/api/auth/login', {
        'email': email, 'password': password,
    })[2])
    assert logged_in.get('ok') and logged_in.get('token')
    assert json.loads(request('/api/auth/me', token=logged_in['token'])[2]).get('ok')
    for path in ('/user', '/user/ewallet', '/user/account', '/user/saldo'):
        status, url, body = request(path)
        assert status == 200 and '/login' not in urllib.parse.urlparse(url).path, path
        assert 'NEXT_HTTP_ERROR' not in body, path
        print(f'{path}: authenticated HTTP 200', flush=True)
    brands = json.loads(request('/v1/app/brand?kategori_id=3')[2])['items']
    gopay = next(brand for brand in brands if brand['nama'].upper() == 'GOPAY')
    products = json.loads(request(f'/v1/app/produk?kategori_id=3&brand_id={gopay["id"]}')[2])['items']
    assert products and any('OPEN AMOUNT' in product['nama'].upper() for product in products)
    print('Registration, login cookie, session and GoPay catalog: OK', flush=True)
finally:
    # The email is a random hex suffix generated above, never user-supplied SQL.
    result = subprocess.run(
        ['runuser', '-u', 'postgres', '--', 'psql', '-X', '-qAt',
         '-v', 'ON_ERROR_STOP=1', '-d', 'lajutopup'],
        input=f"DELETE FROM member WHERE email='{email}';", text=True,
        capture_output=True,
    )
    if result.returncode:
        raise RuntimeError('Could not remove verification member: ' + result.stderr)
    print('Disposable verification member removed', flush=True)
