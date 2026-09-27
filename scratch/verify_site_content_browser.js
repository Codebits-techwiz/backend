import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/mk236/.gemini/antigravity-ide/brain/906f0095-a083-486e-91d7-e109c563526e';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runBrowserVerification() {
  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // 1. Home Page Verification
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  const homeScreenshotPath = path.join(ARTIFACT_DIR, 'home_page_real.png');
  await page.screenshot({ path: homeScreenshotPath, fullPage: false });
  console.log('Saved real Home Page screenshot to:', homeScreenshotPath);

  // Check Sitemap link presence
  const sitemapLinkCount = await page.$$eval('a[href="/sitemap"]', links => links.length);
  console.log('Found Sitemap links in DOM:', sitemapLinkCount);

  // 2. Admin Login & CMS Page
  console.log('Navigating to http://localhost:5173/admin-login...');
  await page.goto('http://localhost:5173/admin-login', { waitUntil: 'networkidle2' });

  await page.type('input[type="email"]', 'admin@campuscoin.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('Logged in as Admin. Current URL:', page.url());

  console.log('Navigating to http://localhost:5173/admin/site-content...');
  await page.goto('http://localhost:5173/admin/site-content', { waitUntil: 'networkidle2' });

  const adminScreenshotPath = path.join(ARTIFACT_DIR, 'admin_site_content_real.png');
  await page.screenshot({ path: adminScreenshotPath, fullPage: false });
  console.log('Saved real Admin CMS screenshot to:', adminScreenshotPath);

  // 3. Edit Hero Headline via React State Native Setter and Save
  console.log('Updating Hero Headline 1 on Admin CMS page via React native setter...');
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const headlineInput = inputs.find(i => i.value && (i.value.includes('Master') || i.value.includes('Control')));
    if (headlineInput) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(headlineInput, 'Master your campus budget,');
      headlineInput.dispatchEvent(new Event('input', { bubbles: true }));
      headlineInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find(b => b.textContent.includes('Save Hero Section'));
    if (saveBtn) {
      saveBtn.click();
    }
  });

  await sleep(1500);

  // 4. Reload Home Page and Verify Updated Text
  console.log('Navigating back to http://localhost:5173 to verify live update...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  const updatedHomeScreenshotPath = path.join(ARTIFACT_DIR, 'home_page_updated_real.png');
  await page.screenshot({ path: updatedHomeScreenshotPath, fullPage: false });
  console.log('Saved real Updated Home Page screenshot to:', updatedHomeScreenshotPath);

  const bodyText = await page.evaluate(() => document.body.innerText);
  const headlineFound = bodyText.includes('Master your campus budget,');
  console.log('Updated headline found on live Home page:', headlineFound);

  await browser.close();
  console.log('Browser verification completed successfully!');
}

runBrowserVerification().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
