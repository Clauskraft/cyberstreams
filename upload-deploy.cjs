require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

console.log('🚀 CYBERSTREAMS DIRECT UPLOAD DEPLOYMENT\n');

// Upload via multipart/form-data
async function uploadZipFile() {
  console.log('📤 Uploading cyberstreams-deploy-v1.2.0.zip...\n');

  const form = new FormData();
  form.append('file', fs.createReadStream('cyberstreams-deploy-v1.2.0.zip'));

  const options = {
    method: 'POST',
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/cyberstreams/deployments`,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      ...form.getHeaders()
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      console.log(`Status: ${res.statusCode}`);

      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('\nResponse:', body.substring(0, 500));

        try {
          const json = JSON.parse(body);
          if (json.success) {
            console.log('\n✅ Upload successful!');
            console.log('Deployment ID:', json.result.id);
            console.log('URL:', json.result.url);
            resolve(json.result);
          } else {
            console.log('\n❌ Upload failed');
            console.log('Errors:', JSON.stringify(json.errors, null, 2));
            reject(new Error(JSON.stringify(json.errors)));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\n${body}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
      reject(e);
    });

    form.pipe(req);
  });
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

// Main
(async () => {
  try {
    const result = await uploadZipFile();

    console.log('\n⏳ Waiting 15 seconds for deployment to go live...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('\n🧪 Testing deployment...');
    const test = await testUrl('https://cyberstreams.pages.dev');
    console.log(`https://cyberstreams.pages.dev: ${test.status} ${test.ok ? '✅ LIVE!' : '⚠️ Not ready yet'}`);

    if (!test.ok) {
      console.log('\nWaiting 30 more seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      const retest = await testUrl('https://cyberstreams.pages.dev');
      console.log(`https://cyberstreams.pages.dev: ${retest.status} ${retest.ok ? '✅ LIVE!' : '❌ Still not ready'}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
