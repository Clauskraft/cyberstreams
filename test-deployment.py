#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
import sys

# Fix Windows encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

urls = [
    "https://cyberstreams.pages.dev",
    "https://cyberfeeds.io",
    "https://www.cyberfeeds.io",
    "https://cyberfeeds.live",
    "https://www.cyberfeeds.live",
    "https://cyberfeeds.org",
    "https://www.cyberfeeds.org",
    "https://cyberfeeds.dk",
    "https://www.cyberfeeds.dk"
]

print("============================================================")
print("TESTING ALL DEPLOYMENT URLS")
print("============================================================\n")

results = {"ok": [], "pending": [], "error": []}

for url in urls:
    try:
        response = requests.head(url, timeout=10, allow_redirects=True)
        status = response.status_code

        if status == 200:
            print(f"[OK] {url} - {status}")
            results["ok"].append(url)
        elif status == 404:
            print(f"[404] {url} - NOT DEPLOYED YET")
            results["error"].append(url)
        elif status in [301, 302, 307, 308]:
            print(f"[REDIRECT] {url} - {status}")
            results["pending"].append(url)
        else:
            print(f"[{status}] {url}")
            results["pending"].append(url)

    except requests.exceptions.Timeout:
        print(f"[TIMEOUT] {url}")
        results["error"].append(url)
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] {url} - {str(e)[:50]}")
        results["error"].append(url)

print("\n============================================================")
print("SUMMARY")
print("============================================================")
print(f"[OK] Working: {len(results['ok'])}")
print(f"[PENDING] Pending/DNS: {len(results['pending'])}")
print(f"[ERROR] Errors: {len(results['error'])}")

if results["ok"]:
    print("\n[OK] Working URLs:")
    for url in results["ok"]:
        print(f"  - {url}")

if results["error"]:
    print("\n[ERROR] Not deployed/Error URLs:")
    for url in results["error"]:
        print(f"  - {url}")

if results["pending"]:
    print("\n[PENDING] Pending URLs (may need DNS propagation):")
    for url in results["pending"]:
        print(f"  - {url}")

if len(results["ok"]) == len(urls):
    print("\n[OK] ALL WEBSITES ARE LIVE!")
elif len(results["ok"]) > 0:
    print("\n[PARTIAL] Some websites are live, others may need DNS propagation")
else:
    print("\n[WARN] No websites are live yet - deployment upload required")

print()
