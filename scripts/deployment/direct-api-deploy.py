#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import json
import zipfile
import requests
from pathlib import Path

# Fix Windows encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

API_TOKEN = "Q0p_AFz1m3rub8wsjUQSl-Mfy1ceGfOe6cTewNpw"
ACCOUNT_ID = "23b3799e11009b55048086157faff1a1"
PROJECT_NAME = "cyberstreams"

print("="*60)
print("CLOUDFLARE PAGES DEPLOYMENT VIA API")
print("="*60)
print()

# Create deployment bundle with manifest
bundle_path = "cloudflare-deploy-bundle.zip"
dist_dir = "dist"

print(f"📦 Creating deployment bundle from {dist_dir}/...")

with zipfile.ZipFile(bundle_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # Walk through dist directory
    for root, dirs, files in os.walk(dist_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, dist_dir)
            print(f"  Adding: {arcname}")
            zipf.write(file_path, arcname)

print(f"✓ Bundle created: {bundle_path}")
print()

# Create deployment via API
print("🚀 Creating deployment...")

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

# Step 1: Create deployment
create_url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/deployments"

create_payload = {
    "branch": "main"
}

print("  Initiating deployment...")
response = requests.post(create_url, headers=headers, json=create_payload)

if response.status_code not in [200, 201]:
    print(f"❌ Failed to create deployment: {response.status_code}")
    print(response.text)
    sys.exit(1)

result = response.json()
if not result.get("success"):
    print(f"❌ API Error: {result.get('errors')}")
    sys.exit(1)

deployment_id = result["result"]["id"]
upload_url = result["result"]["upload_url"]
print(f"✓ Deployment created: {deployment_id}")
print()

# Step 2: Upload files
print("📤 Uploading files...")

with open(bundle_path, 'rb') as f:
    files = {'file': (bundle_path, f, 'application/zip')}
    upload_response = requests.put(
        upload_url,
        files=files,
        headers={"Authorization": f"Bearer {API_TOKEN}"}
    )

if upload_response.status_code not in [200, 201]:
    print(f"❌ Upload failed: {upload_response.status_code}")
    print(upload_response.text)
    sys.exit(1)

print("✓ Files uploaded successfully")
print()

# Step 3: Finalize deployment
print("🎯 Finalizing deployment...")

finalize_url = f"{create_url}/{deployment_id}/finalize"
finalize_response = requests.post(
    finalize_url,
    headers=headers
)

if finalize_response.status_code not in [200, 201]:
    print(f"❌ Finalization failed: {finalize_response.status_code}")
    print(finalize_response.text)
    sys.exit(1)

print("✓ Deployment finalized")
print()

# Clean up
os.remove(bundle_path)

print("="*60)
print("✅ DEPLOYMENT SUCCESSFUL!")
print("="*60)
print()
print(f"🌐 Your site is deploying to:")
print(f"   https://cyberstreams.pages.dev")
print(f"   https://cyberfeeds.io")
print(f"   https://cyberfeeds.live")
print(f"   https://cyberfeeds.org")
print(f"   https://cyberfeeds.dk")
print()
print("⏱️  Deployment will be live in 1-2 minutes")
print()
