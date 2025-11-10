import { chromium } from 'playwright';
import { readFileSync } from 'fs';

async function test() {
  console.log('Testing Playwright with simple HTML...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const html = readFileSync('./test-simple-html.html', 'utf-8');

  console.log('Setting content...');
  await page.setContent(html, { waitUntil: 'networkidle' });

  console.log('Waiting for selector...');
  try {
    await page.waitForSelector('#root > *', { timeout: 10000 });
    console.log('✅ Element found!');

    const screenshot = await page.screenshot();
    console.log('Screenshot size:', screenshot.length);
  } catch (error) {
    console.log('❌ Timeout waiting for element');
    console.log('Error:', error);

    // Get page content to debug
    const content = await page.content();
    console.log('Page HTML length:', content.length);

    // Check console errors
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error));
  }

  await browser.close();
}

test().catch(console.error);
