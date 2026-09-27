const puppeteer = require('puppeteer');
const path = require('path');

async function runFullVerification() {
  const artifactDir = 'C:\\Users\\mk236\\.gemini\\antigravity-ide\\brain\\906f0095-a083-486e-91d7-e109c563526e';

  console.log('Launching Puppeteer browser for multi-phase verification...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();

  // 1. Desktop Full Home Page Screenshot
  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const homeFullPath = path.join(artifactDir, 'home_full_page_rebuilt.png');
  await page.screenshot({ path: homeFullPath, fullPage: true });
  console.log('Saved home_full_page_rebuilt.png');

  // 2. Mobile Viewport Screenshot (390px width)
  console.log('Testing mobile view at 390x844 ...');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const mobilePath = path.join(artifactDir, 'home_mobile_responsive.png');
  await page.screenshot({ path: mobilePath, fullPage: true });
  console.log('Saved home_mobile_responsive.png');

  // 3. Admin Login & CMS Branding Tab
  await page.setViewport({ width: 1280, height: 900 });
  console.log('Logging into Admin on http://localhost:5173/admin-login ...');
  await page.goto('http://localhost:5173/admin-login', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  await page.type('input[type="email"]', 'admin@campuscoin.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2000));

  console.log('Navigating to http://localhost:5173/admin/site-content ...');
  await page.goto('http://localhost:5173/admin/site-content', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const adminBrandingPath = path.join(artifactDir, 'admin_branding_tab.png');
  await page.screenshot({ path: adminBrandingPath, fullPage: true });
  console.log('Saved admin_branding_tab.png');

  await browser.close();
  console.log('Multi-phase verification complete!');
}

runFullVerification().catch(console.error);
