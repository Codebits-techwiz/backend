const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const OUT = path.resolve('E:/Techwiz Project/docs/ui-screenshots');

const PUBLIC_PAGES = [
  { file: '01-home.png', route: '/', title: 'Home' },
  { file: '02-features.png', route: '/features', title: 'Features' },
  { file: '03-how-it-works.png', route: '/how-it-works', title: 'How It Works' },
  { file: '04-user-guide.png', route: '/user-guide', title: 'User Guide' },
  { file: '05-testimonials.png', route: '/testimonials', title: 'Testimonials' },
  { file: '06-pricing.png', route: '/pricing', title: 'Pricing' },
  { file: '07-privacy-policy.png', route: '/privacy-policy', title: 'Privacy Policy' },
  { file: '08-sitemap.png', route: '/sitemap', title: 'Sitemap' },
  { file: '09-login.png', route: '/login', title: 'Student Login' },
  { file: '10-register.png', route: '/register', title: 'Register' },
  { file: '11-forgot-password.png', route: '/forgot-password', title: 'Forgot Password' },
  { file: '12-admin-login.png', route: '/admin-login', title: 'Admin Login' },
];

const STUDENT_PAGES = [
  { file: '13-student-dashboard.png', route: '/app', title: 'Student Dashboard' },
  { file: '14-transactions.png', route: '/app/transactions', title: 'Transactions' },
  { file: '15-categories.png', route: '/app/categories', title: 'Categories' },
  { file: '16-budgets.png', route: '/app/budgets', title: 'Budgets' },
  { file: '17-recurring.png', route: '/app/recurring', title: 'Recurring' },
  { file: '18-reports.png', route: '/app/reports', title: 'Reports' },
  { file: '19-insights.png', route: '/app/insights', title: 'AI Insights' },
  { file: '20-bookmarks.png', route: '/app/bookmarks', title: 'Bookmarks' },
  { file: '21-profile.png', route: '/app/profile', title: 'Profile & Settings' },
];

const ADMIN_PAGES = [
  { file: '22-admin-dashboard.png', route: '/admin', title: 'Admin Dashboard' },
  { file: '23-admin-users.png', route: '/admin/users', title: 'User Accounts' },
  { file: '24-admin-categories.png', route: '/admin/categories', title: 'Default Categories' },
  { file: '25-admin-announcements.png', route: '/admin/announcements', title: 'Announcements' },
  { file: '26-admin-tip-templates.png', route: '/admin/tip-templates', title: 'AI Tip Templates' },
  { file: '27-admin-site-content.png', route: '/admin/site-content', title: 'Site Content' },
  { file: '28-admin-stats.png', route: '/admin/stats', title: 'Usage Statistics' },
];

async function hideChrome(page) {
  await page.evaluate(() => {
    const hide = (el) => {
      if (el) el.style.setProperty('display', 'none', 'important');
    };
    // No site header / footer / side nav in documentation shots
    document.querySelectorAll('nav, header, footer').forEach(hide);
    // Floating chat / overlays
    document.querySelectorAll('.fixed').forEach(hide);
    // Expand main content after chrome is removed
    const main = document.querySelector('main');
    if (main) {
      main.style.setProperty('margin', '0', 'important');
      main.style.setProperty('padding', '24px', 'important');
      main.style.setProperty('max-width', '100%', 'important');
      main.style.setProperty('width', '100%', 'important');
    }
    const wrappers = document.querySelectorAll('body > div, #root > div');
    wrappers.forEach((el) => {
      el.style.setProperty('display', 'block', 'important');
    });
  });
}

async function shot(page, file, fullPage = true) {
  await hideChrome(page);
  await new Promise((r) => setTimeout(r, 400));
  const dest = path.join(OUT, file);
  await page.screenshot({ path: dest, fullPage, type: 'png' });
  console.log('Saved', file);
}

async function login(page, email, password, loginPath) {
  await page.goto(`${BASE}${loginPath}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.click('input[type="email"]', { clickCount: 3 });
  await page.type('input[type="email"]', email);
  await page.click('input[type="password"]', { clickCount: 3 });
  await page.type('input[type="password"]', password);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {}),
  ]);
  await new Promise((r) => setTimeout(r, 1500));
}

async function captureList(page, list) {
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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  console.log('Capturing public pages...');
  await captureList(page, PUBLIC_PAGES);

  console.log('Capturing student pages...');
  await login(page, 'student@campuscoin.com', 'password123', '/login');
  await captureList(page, STUDENT_PAGES);

  // Clear session for admin
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.clear();
    sessionStorage.clear();
  });

  console.log('Capturing admin pages...');
  await login(page, 'admin@campuscoin.com', 'password123', '/admin-login');
  await captureList(page, ADMIN_PAGES);

  await browser.close();
  console.log('Done. Screenshots in', OUT);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
