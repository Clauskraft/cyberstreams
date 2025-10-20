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

domains = {
    "cyberfeeds.io": "0710b41fdb7167c6ec723ddf8551462f",
    "cyberfeeds.live": "a0ebcfc68efbb3fa601ac3221363f672",
    "cyberfeeds.org": "785920649ebda0b94a68498ac5323a2f",
    "cyberfeeds.dk": "2438ce0e8cc359b89fe9c75f22b1f222"
}

target = "cyberstreams.pages.dev"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

for domain, zone_id in domains.items():
    print(f"\n{'='*60}")
    print(f"Configuring DNS for {domain}")
    print(f"{'='*60}")

    # Create root domain CNAME
    print(f"\nCreating CNAME for @ -> {target}")
    payload = {
        "type": "CNAME",
        "name": "@",
        "content": target,
        "ttl": 1,
        "proxied": True
    }

    url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"
    response = requests.post(url, headers=headers, json=payload, timeout=30)

    if response.status_code == 200:
        print(f"[OK] Root CNAME created for {domain}")
    else:
        print(f"[FAIL] Failed: {response.status_code}")
        print(f"  Response: {response.text}")

    # Create www subdomain CNAME
    print(f"\nCreating CNAME for www -> {target}")
    payload = {
        "type": "CNAME",
        "name": "www",
        "content": target,
        "ttl": 1,
        "proxied": True
    }

    response = requests.post(url, headers=headers, json=payload, timeout=30)

    if response.status_code == 200:
        print(f"[OK] WWW CNAME created for www.{domain}")
    else:
        print(f"[FAIL] Failed: {response.status_code}")
        print(f"  Response: {response.text}")

print(f"\n{'='*60}")
print("DNS Configuration Summary")
print(f"{'='*60}")
print(f"Target: {target}")
print(f"Domains configured:")
for domain in domains.keys():
    print(f"  - {domain}")
    print(f"  - www.{domain}")
print(f"\nNote: DNS propagation can take 1-24 hours")
print(f"Test URLs immediately: https://cyberstreams.pages.dev")
