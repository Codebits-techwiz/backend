import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  
  await page.type('input[type="email"]', 'student@campuscoin.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  console.log("Waiting for dashboard...");
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // Get text of cards
  const cards = await page.$$eval('.grid.sm\\:grid-cols-3 > div', els => 
    els.map(el => el.innerText.replace(/\n/g, ' | '))
  );
  
  console.log("DASHBOARD CARDS:");
  cards.forEach(c => console.log(c));

  await page.screenshot({ path: 'scratch/dashboard.png' });
  console.log("Saved dashboard screenshot");

  await browser.close();
  process.exit();
}
run();
