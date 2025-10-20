#!/usr/bin/env python3
import requests
import sys

API_TOKEN = "Q0p_AFz1m3rub8wsjUQSl-Mfy1ceGfOe6cTewNpw"
ACCOUNT_ID = "23b3799e11009b55048086157faff1a1"
PROJECT_NAME = "cyberstreams"

print("Uploading cyberstreams-deploy-v1.2.0.zip to Cloudflare Pages...")

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/deployments"

headers = {
    "Authorization": f"Bearer {API_TOKEN}"
}

zip_file = "cyberstreams-deploy-v1.2.0.zip"

try:
    with open(zip_file, 'rb') as f:
        files = {
            'file': (zip_file, f, 'application/zip')
        }

        print(f"Uploading {zip_file}...")
        response = requests.post(url, headers=headers, files=files, timeout=300)

        print(f"Status Code: {response.status_code}")

        if response.status_code in [200, 201]:
            data = response.json()
            if data.get("success"):
                result = data.get("result", {})
                deploy_url = result.get("url", "Unknown")
                deploy_id = result.get("id", "Unknown")
                print(f"SUCCESS!")
                print(f"Deployment ID: {deploy_id}")
                print(f"URL: {deploy_url}")
                print(f"Production URL: https://cyberstreams.pages.dev")
            else:
                print(f"Error: {data}")
                sys.exit(1)
        else:
            print(f"Upload failed: {response.status_code}")
            print(f"Response: {response.text}")
            sys.exit(1)

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
