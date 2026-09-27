const puppeteer = require('puppeteer');
const path = require('path');

async function runBrowserVerification() {
  const artifactDir = 'C:\\Users\\mk236\\.gemini\\antigravity-ide\\brain\\906f0095-a083-486e-91d7-e109c563526e';
  
  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();

  // Step A: Load Home Page
  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const homeScreenshotPath = path.join(artifactDir, 'home_page_clean_real.png');
  await page.screenshot({ path: homeScreenshotPath, fullPage: true });
  console.log('Saved home_page_clean_real.png');

  // Step B: Login as Admin on /admin-login
  console.log('Navigating to http://localhost:5173/admin-login ...');
  await page.goto('http://localhost:5173/admin-login', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  await page.type('input[type="email"]', 'admin@campuscoin.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));

  // Step C: Go to Admin Site Content Page
  console.log('Navigating to http://localhost:5173/admin/site-content ...');
  await page.goto('http://localhost:5173/admin/site-content', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const adminScreenshotPath = path.join(artifactDir, 'admin_site_content_clean_real.png');
  await page.screenshot({ path: adminScreenshotPath, fullPage: true });
  console.log('Saved admin_site_content_clean_real.png');

  // Step D: Update Hero headline via Admin Page
  console.log('Editing Hero headline on Admin CMS page...');
  await page.evaluate(() => {
    const headlineInput = document.querySelector('input[value*="Master"]');
    if (headlineInput) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(headlineInput, 'Master your campus budget,');
      headlineInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  const saveButton = await page.$('button[type="submit"]');
  if (saveButton) {
    await saveButton.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  // Step E: Reload Home Page and confirm update
  console.log('Reloading Home Page to confirm live update...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const homeUpdatedPath = path.join(artifactDir, 'home_page_updated_clean_real.png');
  await page.screenshot({ path: homeUpdatedPath, fullPage: true });
  console.log('Saved home_page_updated_clean_real.png');

  await browser.close();
  console.log('Puppeteer browser verification complete!');
}

runBrowserVerification().catch(console.error);
