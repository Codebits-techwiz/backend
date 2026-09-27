import puppeteer from 'puppeteer';

async function verifyUI() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to register...");
  await page.goto('http://localhost:5174/register', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'd:\\Campus-coin\\server\\scratch\\register_dropdown.png' });
  
  await page.type('input[type="text"]', 'Live UAT User');
  await page.type('input[type="email"]', 'uat@campuscoin.com');
  await page.type('input[type="password"]', 'password123');
  
  // We leave the dropdown alone (should be PKR by default)
  
  console.log("Submitting registration...");
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 4000));
  
  console.log("Taking Dashboard screenshot after registration...");
  await page.screenshot({ path: 'd:\\Campus-coin\\server\\scratch\\dashboard_pkr.png' });
  
  console.log("Navigating to /app/profile...");
  await page.goto('http://localhost:5174/app/profile', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Taking Profile screenshot...");
  await page.screenshot({ path: 'd:\\Campus-coin\\server\\scratch\\profile_pkr.png' });
  
  await browser.close();
  console.log("DONE!");
}

verifyUI().catch(console.error);
