#!/usr/bin/env node
/**
 * tools/verificare-date.js
 * -------------------------------------------------------------------------
 * Verificare date oficiale UGR Filiala Sector 1 vs. ugrsector1.ro
 *
 * Context:  vezi VERIFICARE-DATE-UGR-SECTOR1.md
 * Rulare:   node tools/verificare-date.js
 * Iesire:   raport per check, cu [OK] / [FAIL] / [INFO]
 *
 * NOTA: ruleaza cu node, NU cu PowerShell Select-String — console-ul PS
 * distruge diacriticele (PĂUN -> PAUN) si produce false-negative-uri.
 * -------------------------------------------------------------------------
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const exists = (f) => fs.existsSync(path.join(ROOT, f));

const BRD = "RO57 BRDE 426S V810 0757 4450";
const BCR = "RO04 RNCB 0074 0104 7856 0001";
const SGR_FORM =
  "1FAIpQLSctDTm-Gxuph4yz2fJRiU2JOurBFgzBXriAUY6rbrtem5vrEQ";

const CORE = [
  "index.html",
  "data.js",
  "script.js",
  "style.css",
  "demos-faq.html",
  "demos-membri.html",
  "demos-calculator.html",
  "demo-21stdev.html",
  "demo-aceternity.html",
  "demo-html5up.html",
  "demo-magicui.html",
  "demo-shadcn.html",
];

let fails = 0;
const results = [];

function check(name, fn) {
  let status = "OK";
  let detail = "";
  try {
    const r = fn();
    if (r && typeof r === "object") {
      status = r.status || "OK";
      detail = r.detail || "";
    }
  } catch (e) {
    status = "FAIL";
    detail = "exceptie: " + e.message;
  }
  if (status === "FAIL") fails++;
  results.push({ name, status, detail });
}

/* ------------------------------------------------------------------ */
console.log("=".repeat(74));
console.log("VERIFICARE DATE OFICIALE — UGR Filiala Sector 1");
console.log("repo: " + ROOT);
console.log("data: " + new Date().toISOString().slice(0, 10));
console.log("=".repeat(74));

/* 1. IBAN BCR — trebuie sa nu existe pe nicium site */
check("1. Cont bancar BCR eliminat (RO04 RNCB / RNCB)", () => {
  const hits = CORE.filter((f) => exists(f) && /RO04\s?RNCB|RNCB/i.test(read(f)));
  return {
    status: hits.length ? "FAIL" : "OK",
    detail: hits.length
      ? "apare in: " + hits.join(", ")
      : "nicio aparitie (corect daca actiunea 4.1 a fost aplicata)",
  };
});

/* 2. IBAN BRD — trebuie sa existe */
check("2. IBAN oficial BRD prezent", () => {
  const re = /RO57\s?BRDE\s?426S\s?V810\s?0757\s?4450/;
  const hits = CORE.filter((f) => exists(f) && re.test(read(f)));
  return {
    status: hits.length ? "OK" : "FAIL",
    detail: hits.length ? "in: " + hits.join(", ") : "IBAN BRD lipseste!",
  };
});

/* 3. Sintaxa JS */
check("3. Sintaxa JS valida (script.js / data.js / borders.js)", () => {
  const bad = [];
  for (const f of ["script.js", "data.js", "borders.js"]) {
    if (!exists(f)) continue;
    try {
      new (require("vm").Script)(read(f), { filename: f });
    } catch (e) {
      bad.push(f + ": " + e.message);
    }
  }
  return {
    status: bad.length ? "FAIL" : "OK",
    detail: bad.length ? bad.join(" | ") : "script.js, data.js, borders.js OK",
  };
});

/* 4. Toate referintele relative se rezolva */
check("4. Referinte relative din radacina se rezolva", () => {
  const re =
    /["'(](?!https?:|\/\/|data:|mailto:|tel:|#|javascript:)([a-zA-Z0-9_\-./]+\.(?:html|css|js|png|jpg|jpeg|webp|svg|ico|pdf|docx|json|geojson))["')]/g;
  const refs = new Set();
  for (const f of CORE) {
    if (!exists(f)) continue;
    for (const m of read(f).matchAll(re)) refs.add(m[1]);
  }
  const missing = [...refs].filter((r) => !exists(r));
  return {
    status: missing.length ? "FAIL" : "OK",
    detail:
      "referinte: " +
      refs.size +
      " | lipsa: " +
      missing.length +
      (missing.length ? " -> " + missing.join(", ") : ""),
  };
});

/* 5. Zero caractere de inlocuire (corupție encoding) */
check("5. Zero caractere U+FFFD (encoding curat)", () => {
  const bad = [];
  for (const f of ["index.html", "style.css", "script.js", "data.js", "README.md"]) {
    if (!exists(f)) continue;
    const n = (read(f).match(/\uFFFD/g) || []).length;
    if (n) bad.push(f + "=" + n);
  }
  return {
    status: bad.length ? "FAIL" : "OK",
    detail: bad.length ? bad.join(", ") : "niciun caracter corupt",
  };
});

/* 6. Link inregistrare SGR 2026 */
check("6. Link inregistrare SGR 2026 prezent", () => {
  const hits = CORE.filter((f) => exists(f) && read(f).includes(SGR_FORM));
  return {
    status: hits.length ? "OK" : "INFO",
    detail: hits.length
      ? "in: " + hits.join(", ")
      : "LIPSA — actiunea 4.2 (asteptat daca nu a fost aplicata)",
  };
});

/* 7. Conducere: cei 6 membri confirmati pe ugrsector1.ro */
check("7. Conducere completa (6 membri, diacritice corecte)", () => {
  const d = read("data.js");
  const need = [
    "Alexandru Dorin PĂUN",
    "Andra Teodora VIȘAN",
    "Alexandru NELEPCU",
    "Ștefan Paul MATEI",
    "Nicoleta BOBÎRCEA",
    "Radu Mihai NIȚĂ",
  ];
  const miss = need.filter((n) => !d.includes(n));
  return {
    status: miss.length ? "FAIL" : "OK",
    detail: miss.length ? "lipsesc: " + miss.join(", ") : need.join(" | "),
  };
});

/* 8. Telefoane oficiale */
check("8. Telefoane oficiale prezente", () => {
  const d = read("data.js");
  const need = ["0726 390 774", "0748 912 263", "0764 572 874", "0722 684 104"];
  const miss = need.filter((n) => !d.includes(n));
  return {
    status: miss.length ? "FAIL" : "OK",
    detail: miss.length ? "lipsesc: " + miss.join(", ") : need.join(" | "),
  };
});

/* 9. E-mail oficial */
check("9. E-mail oficial corect (filiala.ugr.s1@gmail.com)", () => {
  const d = read("data.js");
  const has = d.includes("filiala.ugr.s1@gmail.com");
  const bad = (d.match(/lefterpatrickandrei@gmail\.com/g) || []).length;
  return {
    status: has && bad === 0 ? "OK" : "FAIL",
    detail: has
      ? bad
        ? "ATENTIE: apare si e-mail personal de " + bad + "x"
        : "corect"
      : "e-mail oficial lipseste",
  };
});

/* 10. HTML bine echilibrat */
check("10. Tag-uri HTML echilibrate in index.html", () => {
  const h = read("index.html");
  const tags = ["html", "head", "body", "main", "header", "footer", "section", "nav", "form"];
  const bad = [];
  for (const t of tags) {
    const o = (h.match(new RegExp("<" + t + "(\\s|>)", "gi")) || []).length;
    const c = (h.match(new RegExp("</" + t + ">", "gi")) || []).length;
    if (o !== c) bad.push(t + " " + o + "/" + c);
  }
  return {
    status: bad.length ? "FAIL" : "OK",
    detail: bad.length ? "dezechilibrate: " + bad.join(", ") : tags.length + " tag-uri verificate",
  };
});

/* ------------------------------------------------------------------ */
console.log("");
for (const r of results) {
  const icon = r.status === "OK" ? "OK  " : r.status === "INFO" ? "INFO" : "FAIL";
  console.log("[" + icon + "] " + r.name);
  if (r.detail) console.log("       " + r.detail);
}
console.log("");
console.log("-".repeat(74));
console.log(
  fails === 0
    ? "REZULTAT: niciun check esuat (" + results.length + " check-uri rulate)"
    : "REZULTAT: " + fails + " check(uri) ESUATE din " + results.length
);
console.log("-".repeat(74));
console.log("Referinta: VERIFICARE-DATE-UGR-SECTOR1.md");
process.exit(fails === 0 ? 0 : 1);