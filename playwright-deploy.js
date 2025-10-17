const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📊 DEPLOYMENT STATUS CHECK\n');

  // Test 1: Check current deployment status
  console.log('Testing: https://cyberstreams.pages.dev');
  const response1 = await page.goto('https://cyberstreams.pages.dev');
  console.log(`Status: ${response1.status()} ${response1.status() === 404 ? '❌ NOT FOUND' : '✅ OK'}`);

  console.log('\nTesting: https://5a46310d.cyberstreams.pages.dev');
  const response2 = await page.goto('https://5a46310d.cyberstreams.pages.dev');
  console.log(`Status: ${response2.status()} ${response2.status() === 404 ? '❌ NOT FOUND' : '✅ OK'}`);

  // Test 2: Navigate to Cloudflare Pages project
  console.log('\n\n📦 NAVIGATING TO CLOUDFLARE PAGES PROJECT\n');
  const dashboardUrl = 'https://dash.cloudflare.com/23b3799e11009b55048086157faff1a1/pages/view/cyberstreams';

  console.log(`Opening: ${dashboardUrl}`);
  await page.goto(dashboardUrl);

  // Wait a bit to see the page
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'cloudflare-dashboard.png', fullPage: true });
  console.log('✅ Screenshot saved: cloudflare-dashboard.png');

  // Check if we need to login
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  if (currentUrl.includes('login')) {
    console.log('\n⚠️  LOGIN REQUIRED');
    console.log('Please log in to Cloudflare in the browser window.');
    console.log('The script will continue once logged in...');

    // Wait for navigation to dashboard
    await page.waitForURL('**/pages/view/cyberstreams', { timeout: 300000 }); // 5 min
    console.log('✅ Logged in successfully');
  }

  // Look for deployment upload button
  console.log('\n🔍 Looking for deployment controls...');

  // Take another screenshot
  await page.screenshot({ path: 'cloudflare-pages-project.png', fullPage: true });
  console.log('✅ Screenshot saved: cloudflare-pages-project.png');

  // Try to find upload/create deployment button
  const createButton = await page.locator('button:has-text("Create deployment"), button:has-text("Upload assets"), a:has-text("Create deployment")').first();

  if (await createButton.count() > 0) {
    console.log('✅ Found deployment button');

    console.log('\n📤 UPLOADING DEPLOYMENT\n');
    console.log('Clicking create deployment...');
    await createButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot of upload dialog
    await page.screenshot({ path: 'cloudflare-upload-dialog.png', fullPage: true });
    console.log('✅ Screenshot saved: cloudflare-upload-dialog.png');

    // Look for file upload input
    const fileInput = await page.locator('input[type="file"]').first();

    if (await fileInput.count() > 0) {
      console.log('✅ Found file upload input');
      console.log('Uploading: cyberstreams-deploy-v1.2.0.zip');

      await fileInput.setInputFiles('cyberstreams-deploy-v1.2.0.zip');
      await page.waitForTimeout(2000);

      console.log('✅ File selected');

      // Look for deploy/submit button
      const deployButton = await page.locator('button:has-text("Deploy"), button:has-text("Save and Deploy"), button:has-text("Upload")').first();

      if (await deployButton.count() > 0) {
        console.log('Clicking deploy button...');
        await deployButton.click();

        console.log('\n⏳ WAITING FOR DEPLOYMENT...\n');

        // Wait for deployment to complete (look for success indicators)
        await page.waitForTimeout(30000); // Wait 30 seconds

        await page.screenshot({ path: 'cloudflare-deployment-result.png', fullPage: true });
        console.log('✅ Screenshot saved: cloudflare-deployment-result.png');

        // Test deployment
        console.log('\n🧪 TESTING DEPLOYMENT\n');

        const testResponse = await page.goto('https://cyberstreams.pages.dev');
        console.log(`Status: ${testResponse.status()} ${testResponse.status() === 200 ? '✅ SUCCESS' : '❌ FAILED'}`);

        if (testResponse.status() === 200) {
          await page.screenshot({ path: 'cyberstreams-live.png', fullPage: true });
          console.log('✅ Screenshot saved: cyberstreams-live.png');
          console.log('\n🎉 DEPLOYMENT SUCCESSFUL!\n');
        }
      } else {
        console.log('⚠️  Could not find deploy button');
      }
    } else {
      console.log('⚠️  Could not find file upload input');
    }
  } else {
    console.log('⚠️  Could not find create deployment button');
    console.log('Please check cloudflare-pages-project.png screenshot');
  }

  console.log('\n✅ Script complete. Browser will remain open for 30 seconds...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
