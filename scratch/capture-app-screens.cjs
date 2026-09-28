const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const OUT = path.resolve('E:/Techwiz Project/docs/ui-screenshots');

const STUDENT_PAGES = [
  { file: '13-student-dashboard.png', route: '/app' },
  { file: '14-transactions.png', route: '/app/transactions' },
  { file: '15-categories.png', route: '/app/categories' },
  { file: '16-budgets.png', route: '/app/budgets' },
  { file: '17-recurring.png', route: '/app/recurring' },
  { file: '18-reports.png', route: '/app/reports' },
  { file: '19-insights.png', route: '/app/insights' },
  { file: '20-bookmarks.png', route: '/app/bookmarks' },
  { file: '21-profile.png', route: '/app/profile' },
];

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
    const hide = (el) => {
      if (el) el.style.setProperty('display', 'none', 'important');
    };
    document.querySelectorAll('nav, header, footer').forEach(hide);
    document.querySelectorAll('.fixed').forEach(hide);
    const main = document.querySelector('main');
    if (main) {
      main.style.setProperty('margin', '0', 'important');
      main.style.setProperty('padding', '24px', 'important');
      main.style.setProperty('max-width', '100%', 'important');
      main.style.setProperty('width', '100%', 'important');
    }
  });
}

async function shot(page, file) {
  await hideChrome(page);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, file), fullPage: true, type: 'png' });
  console.log('Saved', file, 'at', page.url());
}

async function fillAndLogin(page, email, password, loginPath, successPathPrefix) {
  await page.goto(`${BASE}${loginPath}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  const emailInput = await page.$('input[type="email"]');
  const passInput = await page.$('input[type="password"]');
  await emailInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await emailInput.type(email, { delay: 20 });
  await passInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await passInput.type(password, { delay: 20 });

  await page.click('button[type="submit"]');

  try {
    await page.waitForFunction(
      (prefix) => {
        const p = window.location.pathname;
        return p === prefix || p.startsWith(prefix + '/');
      },
      { timeout: 25000 },
      successPathPrefix
    );
  } catch (_) {
    const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
    throw new Error(`Login failed for ${email}. URL=${page.url()} TEXT=${text}`);
  }
  await new Promise((r) => setTimeout(r, 2000));
}

async function captureList(page, list) {
  for (const item of list) {
    await page.goto(`${BASE}${item.route}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    await shot(page, item.file);
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  console.log('Student login...');
  await fillAndLogin(page, 'student@campuscoin.com', 'password123', '/login', '/app');
  await captureList(page, STUDENT_PAGES);

  await page.evaluate(async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.clear();
    sessionStorage.clear();
  });

  console.log('Admin login...');
  await fillAndLogin(page, 'admin@campuscoin.com', 'password123', '/admin-login', '/admin');
  await captureList(page, ADMIN_PAGES);

  await browser.close();
  console.log('Done');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
