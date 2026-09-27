import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function verifyUI() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to login...");
  await page.goto('http://localhost:5174/login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.type('input[type="email"]', 'student@campuscoin.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("Taking Dashboard screenshot...");
  await page.screenshot({ path: 'd:\\Campus-coin\\server\\scratch\\dashboard.png' });
  
  let breadcrumb = await page.evaluate(() => {
    const el = document.querySelector('header p.font-semibold.text-cc-forest');
    return el ? el.innerText : null;
  });
  console.log("Dashboard breadcrumb:", breadcrumb);
  
  console.log("Navigating to /app/insights...");
  await page.goto('http://localhost:5174/app/insights', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  breadcrumb = await page.evaluate(() => {
    const el = document.querySelector('header p.font-semibold.text-cc-forest');
    return el ? el.innerText : null;
  });
  console.log("Insights breadcrumb:", breadcrumb);
  
  await page.screenshot({ path: 'd:\\Campus-coin\\server\\scratch\\insights.png' });
  
  console.log("Navigating to /app/transactions...");
  await page.goto('http://localhost:5174/app/transactions', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  breadcrumb = await page.evaluate(() => {
    const el = document.querySelector('header p.font-semibold.text-cc-forest');
    return el ? el.innerText : null;
  });
  console.log("Transactions breadcrumb:", breadcrumb);
  
  console.log("Clicking a transaction...");
  try {
    await page.evaluate(() => {
      const btn = document.querySelector('div.bg-white.border.border-gray-100.rounded-xl.p-4 button');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    breadcrumb = await page.evaluate(() => {
      const el = document.querySelector('header p.font-semibold.text-cc-forest');
      return el ? el.innerText : null;
    });
    console.log("Breadcrumb after clicking transaction:", breadcrumb);
  } catch (e) {
    console.log("Could not click a transaction");
  }

  console.log("Navigating to /app/budgets...");
  await page.goto('http://localhost:5174/app/budgets', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  breadcrumb = await page.evaluate(() => {
    const el = document.querySelector('header p.font-semibold.text-cc-forest');
    return el ? el.innerText : null;
  });
  console.log("Budgets breadcrumb:", breadcrumb);
  
  console.log("Navigating to /app/recurring...");
  await page.goto('http://localhost:5174/app/recurring', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  breadcrumb = await page.evaluate(() => {
    const el = document.querySelector('header p.font-semibold.text-cc-forest');
    return el ? el.innerText : null;
  });
  console.log("Recurring breadcrumb:", breadcrumb);
  
  console.log("Testing PNG download...");
  await page.goto('http://localhost:5174/app/reports', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  await page._client().send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: 'd:\\Campus-coin\\server\\scratch'
  });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const imgBtn = btns.find(b => b.innerText.includes('Export Image'));
    if(imgBtn) imgBtn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  
  await browser.close();
  console.log("DONE!");
}

verifyUI().catch(console.error);
