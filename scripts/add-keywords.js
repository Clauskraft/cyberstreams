#!/usr/bin/env node
import fetch from "node-fetch";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

// Helper to create keyword entries with category and priority
function K(list, category, priority = 1) {
  return list.map((keyword) => ({ keyword, category, priority }));
}

// Privacy / Datatilsyn keywords
const dkPrivacy = K(
  [
    "Datatilsynet",
    "tilsynsbeslutning",
    "påbud",
    "bøde",
    "vejledning",
    "tredjelande",
    "overførsler",
    "databehandleraftale",
    "tilsynsstrategi",
    "logningsregler",
    "sikkerhedsbrud",
    "underretning",
    "cookiebekendtgørelse",
    "ePrivacy",
    "NIS2",
    "CFCS",
    "RIS",
    "CPR",
    "MitID",
    "NemLogin",
    "Mit.dk",
    "digitaliseringsstyrelsen",
    "sundhedsdata",
    "kommunal",
    "region",
    "sikker post",
  ],
  "privacy_dk",
  1
);

const euPrivacy = K(
  [
    "GDPR Article 6",
    "legitimate interest",
    "consent",
    "DPIA",
    "standard contractual clauses",
    "SCCs",
    "international transfers",
    "Schrems",
    "adequacy decision",
    "ePrivacy Regulation",
    "AI Act",
    "Data Act",
    "DMA",
    "DSA",
    "NIS2",
    "Cyber Resilience Act",
    "EDPB guidelines",
    "EDPS opinion",
    "one-stop-shop",
    "lead supervisory authority",
    "binding decision",
    "risk-based approach",
    "privacy by design",
    "pseudonymisation",
    "anonymisation",
  ],
  "privacy_eu",
  1
);

const nationalDpaTerms = K(
  [
    "délibération",
    "sanction",
    "mise en demeure",
    "transferts internationaux",
    "Bußgeld",
    "Anordnung",
    "Datenschutz-Folgenabschätzung",
    "Aufsichtsbehörde",
    "sanción",
    "resolución",
    "encargado del tratamiento",
    "trasferimenti",
    "misure di sicurezza",
    "boete",
    "besluit",
    "verwerkersovereenkomst",
    "doorgifte",
    "sanktionsavgift",
    "föreläggande",
    "tillsyn",
    "hallinnollinen seuraamus",
    "määräys",
  ],
  "privacy_member_states",
  2
);

const globalPrivacy = K(
  [
    "privacy notice",
    "retention policy",
    "data minimization",
    "data breach",
    "incident response",
    "vendor risk",
    "third country",
    "cross-border transfer",
    "data residency",
    "encryption at rest",
    "key management",
    "re-identification",
    "federated learning",
    "synthetic data",
  ],
  "privacy_global",
  2
);

// Cybersecurity, regulation, legislation, political discussion
const dkCyberLaw = K(
  [
    "NIS2 vejledning",
    "NIS2 implementering",
    "kritisk infrastruktur",
    "CFCS trusselsvurdering",
    "beredskabsloven",
    "logningsbekendtgørelsen",
    "sikkerhedshændelse",
    "varsling",
    "Folketinget it-sikkerhed",
    "høring cybersikkerhed",
    "National strategi for cyber- og informationssikkerhed",
  ],
  "cyber_dk",
  1
);

const euCyberLaw = K(
  [
    "NIS2 Directive",
    "Cyber Resilience Act",
    "CER Directive",
    "DORA",
    "AI Act",
    "Data Act",
    "eIDAS 2.0",
    "EUCS",
    "EU cloud scheme",
    "ENISA guidance",
    "EU Parliament debate cybersecurity",
    "Council conclusions cybersecurity",
  ],
  "cyber_eu",
  1
);

const globalCyberLaw = K(
  [
    "CISA directive",
    "Executive Order 14028",
    "critical infrastructure cybersecurity",
    "zero trust mandate",
    "SBOM",
    "software liability",
    "secure by design",
    "ransomware policy",
    "cyber sanctions",
  ],
  "cyber_global",
  2
);

const sectorKeywords = K(
  [
    "HIPAA",
    "PCI DSS",
    "PSD2",
    "PSD3",
    "KYC",
    "AML",
    "EPJ",
    "journaldata",
    "CIS Controls",
    "ISO 27001",
    "ISO 27701",
    "SOC 2",
    "OWASP Top 10",
    "ASVS",
  ],
  "cyber_standards",
  2
);

const ngoActors = K(
  ["NOYB", "EDRi", "Access Now", "BEUC", "EPIC", "Privacy International"],
  "privacy_actors",
  3
);

const allKeywords = [
  ...dkPrivacy,
  ...euPrivacy,
  ...nationalDpaTerms,
  ...globalPrivacy,
  ...dkCyberLaw,
  ...euCyberLaw,
  ...globalCyberLaw,
  ...sectorKeywords,
  ...ngoActors,
];

async function seedKeywords() {
  let created = 0;
  for (const item of allKeywords) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) created++;
    } catch {}
  }
  console.log(`Seeded ${created}/${allKeywords.length} keywords`);
}

seedKeywords()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Keyword seeding failed", e);
    process.exit(1);
  });
