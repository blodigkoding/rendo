import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

// Tuklet adresse skal ikke velte appen
for (const bad of ['__proto__', 'constructor', 'toString', '<img src=x onerror=alert(1)>']) {
  await page.goto(`http://localhost:5173/#/butikk/${encodeURIComponent(bad)}/plan`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const body = await page.evaluate(() => document.body.innerText.slice(0, 60).replace(/\n/g, ' '));
  console.log(`${bad.padEnd(34)} → ${body}`);
}

// Tuklet handleliste
await page.goto('http://localhost:5173/#/butikk/st-rema-as/profil', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('rendo:list:st-rema-as', '{"a":1}');
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.evaluate(() => localStorage.setItem('rendo:list:st-rema-as', '[{"productId":123},{"productId":"x","done":"ja"}]'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
console.log('etter tuklet liste:', await page.evaluate(() => document.querySelectorAll('.tabbar__tab').length));

console.log('ERRORS:', errors.length ? errors.join('\n') : 'ingen');
await browser.close();
