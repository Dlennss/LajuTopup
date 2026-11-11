const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const base = process.env.CATALOG_UI_URL || 'http://localhost:3107';
  const output = process.env.CATALOG_SCREENSHOTS || path.join(process.env.TEMP || '/tmp', 'lajutopup-catalog-screenshots');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [360, 390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      for (const route of ['/kategori', '/ewallet', '/kategori?layanan=game']) {
        const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 120000 });
        assert.equal(response.status(), 200, route);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Horizontal overflow: ${route} at ${width}`);
        await page.locator('main img').evaluateAll((images) => Promise.all(images.map((img) => img.decode().catch(() => {}))));
        const broken = await page.locator('main img').evaluateAll((images) => images.filter((img) => img.getBoundingClientRect().height > 0 && !img.naturalWidth).map((img) => img.src));
        assert.deepEqual(broken, [], `Broken assets: ${route}`);
        await page.screenshot({ path: path.join(output, `${width}-${route.includes('game') ? 'game' : route.slice(1)}.png`), fullPage: true });
      }
      await page.goto(base + '/ewallet', { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: /GOPAY/i }).first().click();
      await page.waitForURL(/\/kategori\/\d+\/brand\/\d+/);
      await page.getByRole('heading', { name: 'GOPAY', exact: true }).waitFor();
      await page.waitForLoadState('networkidle');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `${width}-gopay.png`), fullPage: true });
      await page.getByRole('button', { name: 'Top Up', exact: true }).first().click();
      await page.getByText('CHECKOUT', { exact: false }).first().waitFor();
      await page.screenshot({ path: path.join(output, `${width}-checkout.png`) });
      assert.deepEqual(errors, []);
      console.log(`Viewport ${width}: catalog, brands, product navigation, checkout and assets OK`);
      await page.close();
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../pulsa-fe/lib/h2hr-official-logos.json')));
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const entries = Object.entries(manifest);
    for (let offset = 0; offset < entries.length; offset += 48) {
      const cards = entries.slice(offset, offset + 48).map(([name, value]) => `<div><img src="${base}${value.src}"><p>${name}</p></div>`).join('');
      await page.setContent(`<style>body{font:12px Arial;display:grid;grid-template-columns:repeat(8,1fr);gap:8px}div{border:1px solid #ddd;text-align:center;padding:8px;height:105px}img{height:72px;width:100%;object-fit:contain}</style>${cards}`);
      await page.locator('img').evaluateAll((images) => Promise.all(images.map((img) => img.decode().catch(() => {}))));
      await page.screenshot({ path: path.join(output, `logos-${offset}.png`), fullPage: true });
    }
    console.log(`Screenshots: ${output}`);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
