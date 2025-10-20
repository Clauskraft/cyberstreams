# Cyberstreams OsintLab

The OsintLab subsystem provides a curated OSINT catalog, policy-aware runners, and a React experience for analysts.
This directory contains ingestion tooling, runner implementations, and integration assets for the dashboard.

## Components

- `ingestors/awesome_osint_parser.py` parses the curated Markdown list and hydrates the SQLite registry.
- `registry/osint.db` stores normalized catalog data, diff snapshots, run history, and audit events.
- `runners/` exposes secure execution surfaces for CLI, web, and Docker-based playbooks.
- `mcp/server.py` exposes Model Context Protocol tools (`osint.search`, `osint.info`, `osint.run`).
- `ui/OsintLab.tsx` renders the front-end tab in the Cyberstreams dashboard.
- `scripts/sync_osint_catalog.ps1` performs a repeatable sync from the markdown source.

## Getting Started

1. **Install dependencies**

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
   pip install -r osint/requirements.txt
   ```

2. **Hydrate the catalog**

   ```bash
   python -m osint.ingestors.awesome_osint_parser
   ```

   This command populates `osint/registry/osint.db`, writes a JSON export at
   `cyberstreams/src/data/osint_catalog.json`, and stores a diff snapshot under `osint/registry/snapshots`.

3. **Run tests**

   ```bash
   python -m pytest osint/tests
   ```

4. **Launch the web runner (optional)**

   ```bash
   uvicorn osint.runners.web_runner:app --reload
   ```

## Safety & Compliance

- Accept third-party license requirements by setting `OSINT_LICENSE_ACCEPTED=true` before invoking any runner.
- To work with restricted or confidential sources, obtain compliance approval and set `OSINT_ALLOW_RESTRICTED=true`.
- All runners record audit events to both the SQLite `audit_log` table and the JSONL file at `osint/registry/audit.log`.
- Exported catalog data honours UI filters and should only be shared with authorized stakeholders.

## Automation

- `scripts/sync_osint_catalog.ps1` can be scheduled to keep the catalog synchronized. It is used by the
  GitHub Actions workflow `.github/workflows/osint_catalog_sync.yml` to perform daily refreshes and smoke tests.

## Directory Tree

```
osint/
├── ingestors/
│   ├── awesome_osint_list.md
│   └── awesome_osint_parser.py
├── mcp/
│   └── server.py
├── registry/
│   ├── osint.db
│   └── snapshots/
├── runners/
│   ├── cli_runner.py
│   ├── docker_runner.py
│   ├── policy.py
│   └── web_runner.py
├── scripts/
│   └── sync_osint_catalog.ps1
├── tests/
│   ├── __init__.py
│   └── test_catalog_ingestion.py
└── ui/
    └── OsintLab.tsx
```

Refer to the root `README.md` for dashboard launch instructions.
