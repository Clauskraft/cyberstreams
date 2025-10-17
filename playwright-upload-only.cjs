require('dotenv').config();
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;
  const CLOUDFLARE_PASSWORD = process.env.CLOUDFLARE_PASSWORD;
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

  console.log('🚀 CLOUDFLARE PAGES UPLOAD AUTOMATION\n');

  try {
    // Login
    console.log('🔐 Logging in to Cloudflare...');
    await page.goto('https://dash.cloudflare.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.fill('input[type="email"]', CLOUDFLARE_EMAIL);
    await page.waitForTimeout(1000);

    // Click next if there is one
    const nextBtn = page.locator('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]');
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(2000);
    }

    await page.fill('input[type="password"]', CLOUDFLARE_PASSWORD);
    await page.waitForTimeout(1000);

    await page.locator('button[type="submit"]').first().click();

    console.log('Waiting for login...');
    await page.waitForURL('**/home**', { timeout: 60000 });
    console.log('✅ Logged in\n');

    // Navigate to Pages project
    console.log('📦 Opening Pages project...');
    const pagesUrl = `https://dash.cloudflare.com/${ACCOUNT_ID}/pages/view/cyberstreams`;
    await page.goto(pagesUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    console.log('✅ Pages project loaded\n');

    // Click Create deployment
    console.log('📤 Starting deployment...');
    await page.locator('button:has-text("Create deployment"), a:has-text("Create deployment")').first().click();
    await page.waitForTimeout(3000);

    // Select Upload assets if needed
    const uploadBtn = page.locator('button:has-text("Upload assets"), button:has-text("Direct upload")');
    if (await uploadBtn.count() > 0) {
      await uploadBtn.first().click();
      await page.waitForTimeout(2000);
    }

    // Upload file
    console.log('📁 Uploading cyberstreams-deploy-v1.2.0.zip...');
    const fileInput = page.locator('input[type="file"]').first();

    const zipPath = path.resolve('cyberstreams-deploy-v1.2.0.zip');
    console.log('File path:', zipPath);

    await fileInput.setInputFiles(zipPath);
    await page.waitForTimeout(3000);

    console.log('✅ File uploaded\n');

    // Click Deploy button
    console.log('🚀 Deploying...');
    const deployBtn = page.locator('button:has-text("Deploy"), button:has-text("Save and Deploy"), button:has-text("Create")');
    await deployBtn.first().click();

    console.log('\n⏳ WAITING FOR DEPLOYMENT (60 seconds)...\n');
    await page.waitForTimeout(60000);

    // Test deployment
    console.log('🧪 Testing https://cyberstreams.pages.dev...');
    const testPage = await context.newPage();
    const response = await testPage.goto('https://cyberstreams.pages.dev', { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log(`Status: ${response.status()}`);

    if (response.status() === 200) {
      console.log('\n✅ DEPLOYMENT SUCCESSFUL! Website is live!\n');
      await testPage.screenshot({ path: 'deployment-success.png', fullPage: true });
      console.log('Screenshot saved: deployment-success.png');
    } else {
      console.log('\n⚠️  Deployment may still be processing...\n');
    }

    await testPage.close();

    console.log('\nBrowser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('Error screenshot saved: error-screenshot.png');
  }

  await browser.close();
})();
