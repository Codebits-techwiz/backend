const puppeteer = require('puppeteer');
const path = require('path');

async function runBrandingVerification() {
  const artifactDir = 'C:\\Users\\mk236\\.gemini\\antigravity-ide\\brain\\906f0095-a083-486e-91d7-e109c563526e';

  console.log('Launching Puppeteer for Light/Dark Logo verification...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();

  // 1. Log in to Admin and open Admin Site Content
  console.log('Logging into Admin on http://localhost:5173/admin-login ...');
  await page.goto('http://localhost:5173/admin-login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'admin@campuscoin.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2000));

  console.log('Navigating to http://localhost:5173/admin/site-content ...');
  await page.goto('http://localhost:5173/admin/site-content', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const adminBrandingPath = path.join(artifactDir, 'admin_branding_light_dark_tab.png');
  await page.screenshot({ path: adminBrandingPath, fullPage: true });
  console.log('Saved admin_branding_light_dark_tab.png');

  await browser.close();
  console.log('Branding verification complete!');
}

runBrandingVerification().catch(console.error);
