@echo off
setlocal enabledelayedexpansion

set API_TOKEN=Q0p_AFz1m3rub8wsjUQSl-Mfy1ceGfOe6cTewNpw
set ACCOUNT_ID=23b3799e11009b55048086157faff1a1
set PROJECT_NAME=cyberstreams

echo ============================================================
echo CLOUDFLARE PAGES DEPLOYMENT VIA CURL
echo ============================================================
echo.

echo Uploading cyberstreams-deploy-v1.2.0.zip...
echo.

curl -X POST "https://api.cloudflare.com/client/v4/accounts/%ACCOUNT_ID%/pages/projects/%PROJECT_NAME%/deployments" ^
  -H "Authorization: Bearer %API_TOKEN%" ^
  -F "file=@cyberstreams-deploy-v1.2.0.zip"

echo.
echo.
echo ============================================================
echo Testing deployment...
echo ============================================================
echo.

timeout /t 5 /nobreak >nul

curl -I https://cyberstreams.pages.dev

echo.
echo Done!
echo.
