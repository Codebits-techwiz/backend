const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const OUT = path.resolve('E:/Techwiz Project/docs/ui-screenshots');

const PUBLIC_PAGES = [
  { file: '01-home.png', route: '/' },
  { file: '02-features.png', route: '/features' },
  { file: '03-how-it-works.png', route: '/how-it-works' },
  { file: '04-user-guide.png', route: '/user-guide' },
  { file: '05-testimonials.png', route: '/testimonials' },
  { file: '06-pricing.png', route: '/pricing' },
  { file: '07-privacy-policy.png', route: '/privacy-policy' },
  { file: '08-sitemap.png', route: '/sitemap' },
  { file: '09-login.png', route: '/login' },
  { file: '10-register.png', route: '/register' },
  { file: '11-forgot-password.png', route: '/forgot-password' },
  { file: '12-admin-login.png', route: '/admin-login' },
];

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

async function prepare(page) {
  // Hide only floating widgets — keep page UI intact (no site chrome stripping)
  await page.evaluate(() => {
    document.querySelectorAll('[class*="Faq"], [class*="chat"], [class*="Chat"]').forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
  });
}

async function shot(page, file) {
  await prepare(page);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, file), fullPage: true, type: 'png' });
  console.log('Saved', file);
}

async function login(page, email, password, loginPath, okPath) {
  await page.goto(`${BASE}${loginPath}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('input[type="email"]');
  const emailInput = await page.$('input[type="email"]');
  const passInput = await page.$('input[type="password"]');
  await emailInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await emailInput.type(email, { delay: 15 });
  await passInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await passInput.type(password, { delay: 15 });
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    (prefix) => {
      const p = window.location.pathname;
      return p === prefix || p.startsWith(prefix + '/');
    },
    { timeout: 25000 },
    okPath
  );
  await new Promise((r) => setTimeout(r, 2000));
}

async function capture(page, list) {
  for (const item of list) {
    await page.goto(`${BASE}${item.route}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1200));
    await shot(page, item.file);
  }
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

  await capture(page, PUBLIC_PAGES);

  await login(page, 'student@campuscoin.com', 'password123', '/login', '/app');
  await capture(page, STUDENT_PAGES);

  await page.evaluate(async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.clear();
    sessionStorage.clear();
  });

  await login(page, 'admin@campuscoin.com', 'password123', '/admin-login', '/admin');
  await capture(page, ADMIN_PAGES);

  await browser.close();
  console.log('All screenshots ready');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
