const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  page.on('response', (r) => {
    if (r.url().includes('/api/')) console.log('API', r.status(), r.url());
  });

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'student@campuscoin.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 5000));
  console.log('URL after login:', page.url());
  const toast = await page.evaluate(() => document.body.innerText.slice(0, 800));
  console.log('TEXT:', toast);
  await page.screenshot({ path: 'E:/Techwiz Project/docs/ui-screenshots/_debug-login.png', fullPage: true });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
