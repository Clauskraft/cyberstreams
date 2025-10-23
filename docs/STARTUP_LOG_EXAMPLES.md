# Server startup log examples (no external deps)

Example 1 (development):

[info] Cyberstreams API server running at http://localhost:3001
[info] Intel Scraper auto-started successfully on boot
[warn] PostgreSQL integration store unavailable. Falling back to in-memory storage for API keys.
[warn] Vector client disabled. Missing VECTOR_DB_URL
[warn] OpenCTI client disabled. Missing OPENCTI_API_URL or OPENCTI_TOKEN
[warn] MISP client disabled. Missing MISP_BASE_URL or MISP_API_KEY

Example 2 (production without DB):

[info] Cyberstreams API server running at http://0.0.0.0:3001
[warn] PostgreSQL integration store unavailable. Falling back to in-memory storage for API keys.
[info] POST /api/health 200
[info] GET /readyz 200
