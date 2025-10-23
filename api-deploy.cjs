require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

console.log('🚀 CYBERSTREAMS API DEPLOYMENT\n');
console.log('🔑 API Token:', API_TOKEN.substring(0, 10) + '...');
console.log('🏢 Account ID:', ACCOUNT_ID);

// Helper function for API calls
async function apiCall(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.success) {
            resolve(json.result);
          } else {
            reject(new Error(JSON.stringify(json.errors)));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Upload deployment via Wrangler
async function uploadDeployment() {
  console.log('\n📤 STEP 1: UPLOADING DEPLOYMENT VIA WRANGLER\n');

  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    const env = { ...process.env, CLOUDFLARE_API_TOKEN: API_TOKEN };

    console.log('Running: npx wrangler pages deploy cyberstreams/dist --project-name=cyberstreams');

    const proc = exec('npx wrangler pages deploy cyberstreams/dist --project-name=cyberstreams', { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Upload failed:', error.message);
        console.error('stderr:', stderr);
        reject(error);
      } else {
        console.log(stdout);
        console.log('✅ Deployment uploaded successfully!');
        resolve();
      }
    });

    proc.stdout.on('data', (data) => process.stdout.write(data));
    proc.stderr.on('data', (data) => process.stderr.write(data));
  });
}

// Configure DNS for domain
async function configureDNS(domainName, zoneId) {
  console.log(`\n--- Configuring DNS for ${domainName} ---`);

  // Get existing records
  const records = await apiCall('GET', `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`);

  // Check if root CNAME exists
  const rootCname = records.find(r => r.type === 'CNAME' && r.name === domainName);
  if (!rootCname) {
    console.log('Creating root CNAME (@)...');
    await apiCall('POST', `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      type: 'CNAME',
      name: '@',
      content: 'cyberstreams.pages.dev',
      ttl: 1,
      proxied: true
    });
    console.log('✅ Root CNAME created');
  } else {
    console.log('✅ Root CNAME already exists');
  }

  // Check if www CNAME exists
  const wwwCname = records.find(r => r.type === 'CNAME' && r.name === `www.${domainName}`);
  if (!wwwCname) {
    console.log('Creating www CNAME...');
    await apiCall('POST', `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      type: 'CNAME',
      name: 'www',
      content: 'cyberstreams.pages.dev',
      ttl: 1,
      proxied: true
    });
    console.log('✅ WWW CNAME created');
  } else {
    console.log('✅ WWW CNAME already exists');
  }
}

// Add custom domain to Pages
async function addCustomDomain(domain) {
  console.log(`Adding custom domain: ${domain}`);

  try {
    await apiCall('POST', `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/cyberstreams/domains`, {
      name: domain
    });
    console.log(`✅ ${domain} added`);
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log(`✅ ${domain} already exists`);
    } else {
      console.log(`⚠️  ${domain}: ${e.message}`);
    }
  }
}

// Test URL
async function testUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'HEAD',
      timeout: 10000
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode === 200 });
    });

    req.on('error', () => resolve({ url, status: 0, ok: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: 0, ok: false });
    });

    req.end();
  });
}

// Main execution
(async () => {
  try {
    // Step 1: Upload deployment
    await uploadDeployment();

    // Wait a bit for deployment to propagate
    console.log('\n⏳ Waiting 10 seconds for deployment to propagate...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Test deployment
    console.log('\n🧪 Testing deployment...');
    const deployTest = await testUrl('https://cyberstreams.pages.dev');
    console.log(`https://cyberstreams.pages.dev: ${deployTest.status} ${deployTest.ok ? '✅' : '❌'}`);

    if (!deployTest.ok) {
      console.log('\n⚠️  Deployment not live yet, waiting 20 more seconds...');
      await new Promise(resolve => setTimeout(resolve, 20000));
      const retest = await testUrl('https://cyberstreams.pages.dev');
      console.log(`https://cyberstreams.pages.dev: ${retest.status} ${retest.ok ? '✅' : '❌'}`);
    }

    // Step 2: Configure DNS for all domains
    console.log('\n\n🌐 STEP 2: CONFIGURING DNS FOR ALL DOMAINS\n');

    const domains = [
      { name: 'cyberfeeds.io', zoneId: '0710b41fdb7167c6ec723ddf8551462f' },
      { name: 'cyberfeeds.live', zoneId: 'a0ebcfc68efbb3fa601ac3221363f672' },
      { name: 'cyberfeeds.org', zoneId: '785920649ebda0b94a68498ac5323a2f' }
    ];

    for (const domain of domains) {
      await configureDNS(domain.name, domain.zoneId);
    }

    // Step 3: Add custom domains to Pages
    console.log('\n\n🔗 STEP 3: ADDING CUSTOM DOMAINS TO PAGES PROJECT\n');

    const allDomains = [
      'cyberfeeds.io',
      'www.cyberfeeds.io',
      'cyberfeeds.live',
      'www.cyberfeeds.live',
      'cyberfeeds.org',
      'www.cyberfeeds.org'
    ];

    for (const domain of allDomains) {
      await addCustomDomain(domain);
    }

    // Step 4: Final verification
    console.log('\n\n✅ STEP 4: FINAL VERIFICATION\n');

    const testUrls = [
      'https://cyberstreams.pages.dev',
      'https://cyberfeeds.io',
      'https://www.cyberfeeds.io',
      'https://cyberfeeds.live',
      'https://www.cyberfeeds.live',
      'https://cyberfeeds.org',
      'https://www.cyberfeeds.org'
    ];

    console.log('Testing all URLs...\n');

    for (const url of testUrls) {
      const result = await testUrl(url);
      console.log(`${url}: ${result.status} ${result.ok ? '✅' : '⚠️'}`);
    }

    console.log('\n\n🎉 DEPLOYMENT COMPLETE!\n');
    console.log('Note: DNS propagation can take 1-24 hours.');
    console.log('If domains show errors now, check again in 30 minutes.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
})();
