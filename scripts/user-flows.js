// Cyberstreams - 30 Profile User Flow Runner
// Executes lightweight API flows across multiple personas to validate end-to-end paths

/* eslint-disable no-console */

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3001";
const CONCURRENCY = Number(process.env.USERFLOW_CONCURRENCY || 6);
const TIMEOUT_MS = Number(process.env.USERFLOW_TIMEOUT_MS || 8000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, label) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return Promise.race([
    promise(controller.signal),
    (async () => {
      await sleep(ms + 10);
      throw new Error(`${label || "request"} timed out after ${ms}ms`);
    })(),
  ]).finally(() => clearTimeout(id));
}

async function httpGet(path, signal) {
  const res = await fetch(`${API_BASE}${path}`, { method: "GET", signal });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

async function httpPost(path, body, signal) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    signal,
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.json();
}

const PERSONAS = [
  "Project Leader",
  "System Architect",
  "Integration Architect",
  "GUI/UX Expert",
  "RAG Expert",
  "Orchestrator",
  "SOC Tier 1 Analyst",
  "SOC Tier 2 Analyst",
  "Threat Hunter",
  "CTI Analyst",
  "Red Team Operator",
  "Blue Team Engineer",
  "IR Lead",
  "Forensics Analyst",
  "Malware Analyst",
  "Vulnerability Manager",
  "Risk Manager",
  "Compliance Officer",
  "DevOps Engineer",
  "SRE",
  "Data Engineer",
  "Data Scientist",
  "Product Manager",
  "QA Engineer",
  "Penetration Tester",
  "OpenCTI Operator",
  "MISP Operator",
  "OSINT Researcher",
  "Policy Advisor",
  "Executive Briefing",
];

async function runPersonaFlow(name) {
  const startedAt = Date.now();
  const outcome = {
    name,
    ok: true,
    steps: [],
    error: null,
    ms: 0,
    runId: null,
  };
  try {
    // health check
    await withTimeout(
      (signal) => httpGet("/healthz", signal),
      TIMEOUT_MS,
      `${name} /healthz`
    );
    outcome.steps.push("health");

    // load basic data
    const sources = await withTimeout(
      (signal) => httpGet("/api/admin/sources", signal),
      TIMEOUT_MS,
      `${name} sources`
    );
    if (!sources?.success) throw new Error("sources not ok");
    outcome.steps.push(
      `sources:${Array.isArray(sources?.data) ? sources.data.length : 0}`
    );

    const rag = await withTimeout(
      (signal) => httpGet("/api/admin/rag-config", signal),
      TIMEOUT_MS,
      `${name} rag-config`
    );
    if (!rag?.success) throw new Error("rag-config not ok");
    outcome.steps.push("rag-config");

    // start orchestrator run
    const goal = `Run ${name} flow: validate sources and RAG config, then prepare brief.`;
    const run = await withTimeout(
      (signal) => httpPost("/api/orchestrator/runs", { goal }, signal),
      TIMEOUT_MS,
      `${name} run`
    );
    const runId = run?.data?.id;
    if (!runId) throw new Error("run id missing");
    outcome.runId = runId;
    outcome.steps.push(`run:${runId}`);

    outcome.ms = Date.now() - startedAt;
    return outcome;
  } catch (err) {
    outcome.ok = false;
    outcome.error = String(err?.message || err);
    outcome.ms = Date.now() - startedAt;
    return outcome;
  }
}

async function runBatches(items, limit, fn) {
  const results = [];
  let idx = 0;
  const inFlight = new Set();
  async function pump() {
    while (idx < items.length && inFlight.size < limit) {
      const item = items[idx++];
      const p = fn(item)
        .then((r) => results.push(r))
        .catch((e) =>
          results.push({ name: String(item), ok: false, error: String(e) })
        )
        .finally(() => inFlight.delete(p));
      inFlight.add(p);
    }
    if (inFlight.size === 0 && idx >= items.length) return;
    await Promise.race(inFlight);
    return pump();
  }
  await pump();
  return results;
}

(async () => {
  console.log("👤 Running 30-profile user flows against", API_BASE);
  const t0 = Date.now();
  const results = await runBatches(PERSONAS, CONCURRENCY, runPersonaFlow);
  const ms = Date.now() - t0;

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  // brief table-like output
  for (const r of results) {
    console.log(
      `${r.ok ? "✅" : "❌"} ${r.name.padEnd(24)} ${String(r.ms).padStart(
        5
      )}ms  ${r.ok ? r.steps.join(", ") : r.error}`
    );
  }

  console.log("\n📊 Summary:");
  console.log(
    `Profiles: ${results.length}, Passed: ${passed}, Failed: ${failed}, Duration: ${ms}ms`
  );
  if (failed > 0) process.exitCode = 1;
})().catch((e) => {
  console.error("Runner failed:", e);
  process.exit(1);
});
