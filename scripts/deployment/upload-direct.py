#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
import os
import sys

# Fix Windows encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

API_TOKEN = "XJ-bepxEWOLiOj-EccLAkFikA9X5t7E3sOEGVWag"
ACCOUNT_ID = "23b3799e11009b55048086157faff1a1"
PROJECT_NAME = "cyberstreams"

print("Uploading til Cloudflare Pages...")

# Direct upload endpoint
url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/deployments"

headers = {
    "Authorization": f"Bearer {API_TOKEN}"
}

# Upload ZIP fil
zip_file = "cyberstreams-deploy.zip"

with open(zip_file, 'rb') as f:
    files = {
        'file': (zip_file, f, 'application/zip')
    }

    print(f"Uploader {zip_file}...")
    response = requests.post(url, headers=headers, files=files, timeout=300)

    print(f"Status: {response.status_code}")

    if response.status_code in [200, 201]:
        data = response.json()
        if data.get("success"):
            result = data.get("result", {})
            deploy_url = result.get("url", "Unknown")
            print(f"SUCCESS!")
            print(f"URL: {deploy_url}")
            print(f"Deployment gennemfoert!")
        else:
            print(f"Fejl: {data}")
    else:
        print(f"Upload fejlede: {response.status_code}")
        print(f"Response: {response.text}")
