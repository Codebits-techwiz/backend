const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const OUT = path.resolve('E:/Techwiz Project/docs/ui-screenshots');

const ADMIN_PAGES = [
  { file: '22-admin-dashboard.png', route: '/admin' },
  { file: '23-admin-users.png', route: '/admin/users' },
  { file: '24-admin-categories.png', route: '/admin/categories' },
  { file: '25-admin-announcements.png', route: '/admin/announcements' },
  { file: '26-admin-tip-templates.png', route: '/admin/tip-templates' },
  { file: '27-admin-site-content.png', route: '/admin/site-content' },
  { file: '28-admin-stats.png', route: '/admin/stats' },
];

async function hideChrome(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[class*="Faq"], [class*="chat"], [class*="Chat"]').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
  });
}

async function shot(page, file) {
  await hideChrome(page);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, file), fullPage: true, type: 'png' });
  console.log('Saved', file, 'at', page.url());
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  await page.goto(`${BASE}/admin-login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]');
  const emailInput = await page.$('input[type="email"]');
  const passInput = await page.$('input[type="password"]');
  await emailInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await emailInput.type('admin@campuscoin.com', { delay: 20 });
  await passInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await passInput.type('password123', { delay: 20 });
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    const p = window.location.pathname;
    return p === '/admin' || p.startsWith('/admin/');
  }, { timeout: 25000 });

  await new Promise((r) => setTimeout(r, 2000));
  console.log('Logged in at', page.url());

  for (const item of ADMIN_PAGES) {
    await page.goto(`${BASE}${item.route}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    await shot(page, item.file);
  }

  await browser.close();
  console.log('Done');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
