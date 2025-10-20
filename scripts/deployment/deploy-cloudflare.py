#!/usr/bin/env python3
"""
Cloudflare Pages Deployment Script
Automatisk deployment af Cyberstreams til Cloudflare Pages
"""

import os
import sys
import json
import zipfile
import requests
from pathlib import Path

# Configuration
API_TOKEN = "XJ-bepxEWOLiOj-EccLAkFikA9X5t7E3sOEGVWag"
ACCOUNT_ID = "23b3799e11009b55048086157faff1a1"
ZONE_ID = "2438ce0e8cc359b89fe9c75f22b1f222"
PROJECT_NAME = "cyberstreams"
DOMAIN = "cyberstreams.dk"
DIST_DIR = "cyberstreams/dist"

BASE_URL = "https://api.cloudflare.com/client/v4"
HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

def log(message, level="INFO"):
    """Log message med farver"""
    colors = {
        "INFO": "\033[0;34m",  # Blue
        "SUCCESS": "\033[0;32m",  # Green
        "WARNING": "\033[1;33m",  # Yellow
        "ERROR": "\033[0;31m",  # Red
        "RESET": "\033[0m"
    }
    color = colors.get(level, colors["INFO"])
    reset = colors["RESET"]
    print(f"{color}[{level}]{reset} {message}")

def check_api_token():
    """Verificer API token"""
    log("Verificerer Cloudflare API token...")
    try:
        response = requests.get(
            f"{BASE_URL}/user/tokens/verify",
            headers=HEADERS,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                log("API token er valid!", "SUCCESS")
                return True
    except Exception as e:
        log(f"Fejl ved token verificering: {e}", "ERROR")
    return False

def create_zip_from_dist():
    """Opret ZIP fil fra dist directory"""
    log(f"Pakker {DIST_DIR} filer...")
    zip_path = "cyberstreams-deploy.zip"

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        dist_path = Path(DIST_DIR)
        for file in dist_path.rglob('*'):
            if file.is_file():
                arcname = file.relative_to(dist_path)
                zipf.write(file, arcname)
                log(f"  Tilføjet: {arcname}")

    size = os.path.getsize(zip_path)
    log(f"ZIP fil oprettet: {zip_path} ({size/1024:.1f} KB)", "SUCCESS")
    return zip_path

def create_pages_project():
    """Opret Cloudflare Pages projekt"""
    log(f"Opretter Pages projekt: {PROJECT_NAME}...")

    url = f"{BASE_URL}/accounts/{ACCOUNT_ID}/pages/projects"
    payload = {
        "name": PROJECT_NAME,
        "production_branch": "main"
    }

    try:
        response = requests.post(url, headers=HEADERS, json=payload, timeout=30)
        data = response.json()

        if response.status_code == 200 and data.get("success"):
            log(f"Pages projekt oprettet!", "SUCCESS")
            return True
        elif response.status_code == 409:
            log(f"Pages projekt eksisterer allerede", "WARNING")
            return True
        else:
            log(f"Fejl ved oprettelse: {data.get('errors', 'Unknown error')}", "ERROR")
            return False
    except Exception as e:
        log(f"Netværksfejl: {e}", "ERROR")
        return False

def upload_to_pages(zip_path):
    """Upload filer til Cloudflare Pages via Direct Upload"""
    log("Uploader filer til Cloudflare Pages...")

    url = f"{BASE_URL}/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/deployments"

    try:
        with open(zip_path, 'rb') as f:
            files = {'file': (zip_path, f, 'application/zip')}
            headers_upload = {"Authorization": f"Bearer {API_TOKEN}"}

            response = requests.post(
                url,
                headers=headers_upload,
                files=files,
                timeout=120
            )

            if response.status_code in [200, 201]:
                data = response.json()
                if data.get("success"):
                    result = data.get("result", {})
                    deployment_url = result.get("url", "N/A")
                    log(f"Deployment succesfuld!", "SUCCESS")
                    log(f"URL: {deployment_url}", "SUCCESS")
                    return deployment_url
            else:
                log(f"Upload fejlede: {response.status_code}", "ERROR")
                log(f"Response: {response.text}", "ERROR")
                return None
    except Exception as e:
        log(f"Upload fejl: {e}", "ERROR")
        return None

def configure_dns():
    """Konfigurer DNS records for custom domain"""
    log(f"Konfigurerer DNS for {DOMAIN}...")

    # Hent eksisterende DNS records
    dns_url = f"{BASE_URL}/zones/{ZONE_ID}/dns_records"

    try:
        response = requests.get(dns_url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            log("Kunne ikke hente DNS records", "ERROR")
            return False

        existing_records = response.json().get("result", [])

        # Tjek om CNAME for @ eksisterer
        root_exists = any(r['name'] == DOMAIN and r['type'] == 'CNAME' for r in existing_records)
        www_exists = any(r['name'] == f'www.{DOMAIN}' and r['type'] == 'CNAME' for r in existing_records)

        # Opret root domain CNAME hvis ikke eksisterer
        if not root_exists:
            log("Opretter CNAME for root domain...")
            payload = {
                "type": "CNAME",
                "name": "@",
                "content": f"{PROJECT_NAME}.pages.dev",
                "ttl": 1,
                "proxied": True
            }
            response = requests.post(dns_url, headers=HEADERS, json=payload, timeout=10)
            if response.status_code == 200:
                log("Root CNAME oprettet", "SUCCESS")
            else:
                log(f"Fejl ved root CNAME: {response.text}", "WARNING")
        else:
            log("Root CNAME eksisterer allerede", "WARNING")

        # Opret www subdomain CNAME hvis ikke eksisterer
        if not www_exists:
            log("Opretter CNAME for www subdomain...")
            payload = {
                "type": "CNAME",
                "name": "www",
                "content": f"{PROJECT_NAME}.pages.dev",
                "ttl": 1,
                "proxied": True
            }
            response = requests.post(dns_url, headers=HEADERS, json=payload, timeout=10)
            if response.status_code == 200:
                log("WWW CNAME oprettet", "SUCCESS")
            else:
                log(f"Fejl ved www CNAME: {response.text}", "WARNING")
        else:
            log("WWW CNAME eksisterer allerede", "WARNING")

        return True
    except Exception as e:
        log(f"DNS konfigurationsfejl: {e}", "ERROR")
        return False

def attach_custom_domain():
    """Tilknyt custom domain til Pages projekt"""
    log(f"Tilknytter {DOMAIN} til Pages projekt...")

    url = f"{BASE_URL}/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/domains"

    for domain in [DOMAIN, f"www.{DOMAIN}"]:
        payload = {"name": domain}
        try:
            response = requests.post(url, headers=HEADERS, json=payload, timeout=30)
            if response.status_code in [200, 201]:
                log(f"Domain tilknyttet: {domain}", "SUCCESS")
            elif response.status_code == 409:
                log(f"Domain allerede tilknyttet: {domain}", "WARNING")
            else:
                log(f"Kunne ikke tilknytte {domain}: {response.text}", "WARNING")
        except Exception as e:
            log(f"Fejl ved tilknytning af {domain}: {e}", "ERROR")

def main():
    """Main deployment workflow"""
    log("=" * 60)
    log("CYBERSTREAMS - CLOUDFLARE DEPLOYMENT", "INFO")
    log("=" * 60)

    # Step 1: Verificer API token
    if not check_api_token():
        log("API token verificering fejlede. Afbryder.", "ERROR")
        return False

    # Step 2: Tjek om dist directory eksisterer
    if not os.path.exists(DIST_DIR):
        log(f"Dist directory ikke fundet: {DIST_DIR}", "ERROR")
        return False

    # Step 3: Opret ZIP fil
    zip_path = create_zip_from_dist()
    if not zip_path or not os.path.exists(zip_path):
        log("Kunne ikke oprette ZIP fil", "ERROR")
        return False

    # Step 4: Opret Pages projekt (hvis ikke eksisterer)
    if not create_pages_project():
        log("Kunne ikke oprette Pages projekt", "ERROR")
        return False

    # Step 5: Upload til Pages
    deployment_url = upload_to_pages(zip_path)
    if not deployment_url:
        log("Upload til Pages fejlede", "ERROR")
        return False

    # Step 6: Konfigurer DNS
    if not configure_dns():
        log("DNS konfiguration fejlede", "WARNING")

    # Step 7: Tilknyt custom domain
    attach_custom_domain()

    # Cleanup
    try:
        os.remove(zip_path)
        log(f"Ryddet op: {zip_path}", "INFO")
    except:
        pass

    # Success summary
    log("=" * 60)
    log("DEPLOYMENT GENNEMFØRT!", "SUCCESS")
    log("=" * 60)
    log(f"Pages URL: {deployment_url}", "SUCCESS")
    log(f"Custom Domain: https://{DOMAIN}", "SUCCESS")
    log(f"Custom Domain: https://www.{DOMAIN}", "SUCCESS")
    log("")
    log("DNS propagation kan tage 1-24 timer", "WARNING")
    log("Test med Pages URL i mellemtiden", "INFO")
    log("=" * 60)

    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        log("\nDeployment afbrudt af bruger", "WARNING")
        sys.exit(1)
    except Exception as e:
        log(f"Uventet fejl: {e}", "ERROR")
        sys.exit(1)
