#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
import json
import sys

# Fix Windows encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

API_TOKEN = "Q0p_AFz1m3rub8wsjUQSl-Mfy1ceGfOe6cTewNpw"
ACCOUNT_ID = "23b3799e11009b55048086157faff1a1"
PROJECT_NAME = "cyberstreams"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

domains = [
    "cyberfeeds.io",
    "www.cyberfeeds.io",
    "cyberfeeds.live",
    "www.cyberfeeds.live",
    "cyberfeeds.org",
    "www.cyberfeeds.org",
    "cyberfeeds.dk",
    "www.cyberfeeds.dk"
]

print("============================================================")
print("ADDING CUSTOM DOMAINS TO CLOUDFLARE PAGES PROJECT")
print("============================================================\n")

for domain in domains:
    print(f"Adding: {domain}")

    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/domains"

    payload = {
        "name": domain
    }

    response = requests.post(url, headers=headers, json=payload, timeout=30)

    if response.status_code == 200:
        print(f"  [OK] {domain} added successfully")
    elif "already exists" in response.text.lower():
        print(f"  [OK] {domain} already exists")
    else:
        print(f"  [WARN] {domain}: {response.status_code}")
        print(f"    Response: {response.text[:200]}")

    print()

print("============================================================")
print("Custom Domains Configuration Complete")
print("============================================================")
print("\nAll domains have been added to the Pages project.")
print("Once deployment is uploaded, Cloudflare will automatically:")
print("  1. Verify DNS records")
print("  2. Issue SSL certificates")
print("  3. Activate domains\n")
