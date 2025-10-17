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

  console.log('🚀 CYBERSTREAMS DEPLOYMENT AUTOMATION\n');
  console.log('📧 Email:', CLOUDFLARE_EMAIL);
  console.log('🏢 Account:', ACCOUNT_ID);

  // Step 1: Login to Cloudflare
  console.log('\n\n🔐 STEP 1: LOGGING IN TO CLOUDFLARE\n');

  await page.goto('https://dash.cloudflare.com/login', { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 });

  console.log('Filling email...');
  await page.fill('input[type="email"], input[name="email"]', CLOUDFLARE_EMAIL);
  await page.waitForTimeout(1000);

  // Check if there's a "Continue" or "Next" button
  const nextButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]').first();
  if (await nextButton.count() > 0) {
    console.log('Clicking continue...');
    await nextButton.click();
    await page.waitForTimeout(2000);
  }

  console.log('Filling password...');
  await page.fill('input[type="password"], input[name="password"]', CLOUDFLARE_PASSWORD);
  await page.waitForTimeout(1000);

  console.log('Submitting login...');
  const loginButton = page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').first();
  await loginButton.click();

  console.log('Waiting for dashboard...');
  await page.waitForURL('**/home**', { timeout: 60000 });
  console.log('✅ Logged in successfully');

  // Step 2: Navigate to Pages project
  console.log('\n\n📦 STEP 2: NAVIGATING TO PAGES PROJECT\n');

  const pagesUrl = `https://dash.cloudflare.com/${ACCOUNT_ID}/pages/view/cyberstreams`;
  console.log('Opening:', pagesUrl);
  await page.goto(pagesUrl, { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 });

  await page.screenshot({ path: 'screenshots/01-pages-project.png', fullPage: true });
  console.log('✅ Screenshot: screenshots/01-pages-project.png');

  // Step 3: Create deployment
  console.log('\n\n📤 STEP 3: UPLOADING DEPLOYMENT\n');

  // Look for "Create deployment" button
  console.log('Looking for Create deployment button...');
  await page.waitForTimeout(2000);

  const createBtn = page.locator('button:has-text("Create deployment"), a:has-text("Create deployment")').first();

  if (await createBtn.count() > 0) {
    console.log('✅ Found button, clicking...');
    await createBtn.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/02-upload-dialog.png', fullPage: true });
    console.log('✅ Screenshot: screenshots/02-upload-dialog.png');

    // Look for "Upload assets" or "Direct upload" option
    const uploadOption = page.locator('button:has-text("Upload assets"), button:has-text("Direct upload"), label:has-text("Upload")').first();
    if (await uploadOption.count() > 0) {
      console.log('Selecting upload method...');
      await uploadOption.click();
      await page.waitForTimeout(2000);
    }

    // Find file input
    console.log('Looking for file input...');
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.count() > 0) {
      console.log('✅ Found file input');

      const zipPath = path.resolve('cyberstreams-deploy-v1.2.0.zip');
      console.log('Uploading:', zipPath);

      await fileInput.setInputFiles(zipPath);
      await page.waitForTimeout(3000);

      console.log('✅ File selected');

      await page.screenshot({ path: 'screenshots/03-file-selected.png', fullPage: true });
      console.log('✅ Screenshot: screenshots/03-file-selected.png');

      // Find and click deploy button
      const deployBtn = page.locator('button:has-text("Deploy"), button:has-text("Save and Deploy"), button:has-text("Create")').first();

      if (await deployBtn.count() > 0) {
        console.log('Clicking Deploy button...');
        await deployBtn.click();

        console.log('\n⏳ WAITING FOR DEPLOYMENT TO COMPLETE...\n');

        // Wait for deployment (look for success message or URL change)
        await page.waitForTimeout(45000); // 45 seconds

        await page.screenshot({ path: 'screenshots/04-deployment-result.png', fullPage: true });
        console.log('✅ Screenshot: screenshots/04-deployment-result.png');

        // Test deployment
        console.log('\n🧪 TESTING DEPLOYMENT\n');

        const testPage = await context.newPage();
        try {
          const response = await testPage.goto('https://cyberstreams.pages.dev', { waitUntil: 'domcontentloaded', timeout: 30000 });
          console.log(`Status: ${response.status()}`);

          if (response.status() === 200) {
            console.log('✅ DEPLOYMENT SUCCESSFUL!');
            await testPage.screenshot({ path: 'screenshots/05-site-live.png', fullPage: true });
            console.log('✅ Screenshot: screenshots/05-site-live.png');
          } else {
            console.log('⚠️  Unexpected status code');
          }
        } catch (e) {
          console.log('❌ Deployment test failed:', e.message);
        }
        await testPage.close();

      } else {
        console.log('⚠️  Could not find Deploy button');
      }
    } else {
      console.log('⚠️  Could not find file input');
    }
  } else {
    console.log('⚠️  Could not find Create deployment button');
  }

  // Step 4: Configure DNS for each domain
  console.log('\n\n🌐 STEP 4: CONFIGURING DNS FOR ALL DOMAINS\n');

  const domains = [
    { name: 'cyberfeeds.io', zoneId: '0710b41fdb7167c6ec723ddf8551462f' },
    { name: 'cyberfeeds.live', zoneId: 'a0ebcfc68efbb3fa601ac3221363f672' },
    { name: 'cyberfeeds.org', zoneId: '785920649ebda0b94a68498ac5323a2f' }
  ];

  for (const domain of domains) {
    console.log(`\n--- Configuring ${domain.name} ---`);

    const dnsUrl = `https://dash.cloudflare.com/${ACCOUNT_ID}/${domain.name}/dns/records`;
    console.log('Opening:', dnsUrl);

    await page.goto(dnsUrl, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await page.waitForTimeout(3000);

    // Create root CNAME record
    console.log('Creating root CNAME record (@)...');

    const addRecordBtn = page.locator('button:has-text("Add record")').first();
    if (await addRecordBtn.count() > 0) {
      await addRecordBtn.click();
      await page.waitForTimeout(2000);

      // Select CNAME type
      const typeSelect = page.locator('select[name="type"], button:has-text("Type")').first();
      if (await typeSelect.count() > 0) {
        await typeSelect.click();
        await page.waitForTimeout(500);
        const cnameOption = page.locator('option[value="CNAME"], li:has-text("CNAME")').first();
        await cnameOption.click();
      }

      // Fill name (@)
      const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]').first();
      await nameInput.fill('@');

      // Fill target (cyberstreams.pages.dev)
      const targetInput = page.locator('input[name="content"], input[placeholder*="Target"]').first();
      await targetInput.fill('cyberstreams.pages.dev');

      // Enable proxy (orange cloud)
      const proxyToggle = page.locator('button[aria-label*="Proxy"], input[type="checkbox"][name="proxied"]').first();
      if (await proxyToggle.count() > 0) {
        await proxyToggle.click();
      }

      // Save
      const saveBtn = page.locator('button:has-text("Save")').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log('✅ Root CNAME created');
      }
    }

    // Create www CNAME record
    console.log('Creating www CNAME record...');

    const addRecordBtn2 = page.locator('button:has-text("Add record")').first();
    if (await addRecordBtn2.count() > 0) {
      await addRecordBtn2.click();
      await page.waitForTimeout(2000);

      // Select CNAME type
      const typeSelect2 = page.locator('select[name="type"], button:has-text("Type")').first();
      if (await typeSelect2.count() > 0) {
        await typeSelect2.click();
        await page.waitForTimeout(500);
        const cnameOption2 = page.locator('option[value="CNAME"], li:has-text("CNAME")').first();
        await cnameOption2.click();
      }

      // Fill name (www)
      const nameInput2 = page.locator('input[name="name"], input[placeholder*="Name"]').first();
      await nameInput2.fill('www');

      // Fill target
      const targetInput2 = page.locator('input[name="content"], input[placeholder*="Target"]').first();
      await targetInput2.fill('cyberstreams.pages.dev');

      // Enable proxy
      const proxyToggle2 = page.locator('button[aria-label*="Proxy"], input[type="checkbox"][name="proxied"]').first();
      if (await proxyToggle2.count() > 0) {
        await proxyToggle2.click();
      }

      // Save
      const saveBtn2 = page.locator('button:has-text("Save")').first();
      if (await saveBtn2.count() > 0) {
        await saveBtn2.click();
        await page.waitForTimeout(3000);
        console.log('✅ WWW CNAME created');
      }
    }

    await page.screenshot({ path: `screenshots/dns-${domain.name}.png`, fullPage: true });
    console.log(`✅ Screenshot: screenshots/dns-${domain.name}.png`);
  }

  // Step 5: Add custom domains to Pages
  console.log('\n\n🔗 STEP 5: ADDING CUSTOM DOMAINS TO PAGES PROJECT\n');

  await page.goto(`https://dash.cloudflare.com/${ACCOUNT_ID}/pages/view/cyberstreams`, { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 });

  // Look for Custom domains tab
  const customDomainsTab = page.locator('a:has-text("Custom domains"), button:has-text("Custom domains")').first();
  if (await customDomainsTab.count() > 0) {
    await customDomainsTab.click();
    await page.waitForTimeout(3000);

    const allDomains = [
      'cyberfeeds.io',
      'www.cyberfeeds.io',
      'cyberfeeds.live',
      'www.cyberfeeds.live',
      'cyberfeeds.org',
      'www.cyberfeeds.org'
    ];

    for (const domain of allDomains) {
      console.log(`Adding: ${domain}`);

      const addDomainBtn = page.locator('button:has-text("Set up a custom domain"), button:has-text("Add")').first();
      if (await addDomainBtn.count() > 0) {
        await addDomainBtn.click();
        await page.waitForTimeout(2000);

        const domainInput = page.locator('input[type="text"]').first();
        await domainInput.fill(domain);
        await page.waitForTimeout(1000);

        const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Add")').first();
        if (await continueBtn.count() > 0) {
          await continueBtn.click();
          await page.waitForTimeout(3000);
          console.log(`✅ ${domain} added`);
        }
      }
    }

    await page.screenshot({ path: 'screenshots/06-custom-domains.png', fullPage: true });
    console.log('✅ Screenshot: screenshots/06-custom-domains.png');
  }

  // Step 6: Final verification
  console.log('\n\n✅ STEP 6: FINAL VERIFICATION\n');

  const testUrls = [
    'https://cyberstreams.pages.dev',
    'https://cyberfeeds.io',
    'https://www.cyberfeeds.io',
    'https://cyberfeeds.live',
    'https://www.cyberfeeds.live',
    'https://cyberfeeds.org',
    'https://www.cyberfeeds.org'
  ];

  for (const url of testUrls) {
    const testPage = await context.newPage();
    try {
      const response = await testPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = response.status();
      console.log(`${url}: ${status} ${status === 200 ? '✅' : '⚠️'}`);
    } catch (e) {
      console.log(`${url}: ❌ ${e.message}`);
    }
    await testPage.close();
  }

  console.log('\n\n🎉 DEPLOYMENT AUTOMATION COMPLETE!\n');
  console.log('Browser will remain open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
})();
