#!/usr/bin/env node
// Lists the interface strings missing from each catalog (vi and en in lib/i18n.js, the
// others in lib/locales), the empty ones, and the ones whose {placeholders} differ from
// the English string. Exits 1 when it finds any.
//
//   npm run i18n:missing            every catalog
//   npm run i18n:missing -- bn      only bn
//
// The keys expected are those of every catalog together, so a key added to one catalog
// only is reported as missing from the others. Needs Node 20.19+ or 22.12+ (it imports
// lib/i18n.js, an ES module in a package without "type": "module").
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Node detects lib/*.js as ES modules from their syntax and warns about it; that warning
// says nothing about the catalogs.
process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (warning.code !== "MODULE_TYPELESS_PACKAGE_JSON") console.warn(warning.stack || String(warning));
});

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { catalogs } = await import(pathToFileURL(path.join(root, "lib", "i18n.js")).href);

const codes = Object.keys(catalogs);
const wanted = process.argv.slice(2);
const unknown = wanted.filter((code) => !codes.includes(code));
if (unknown.length) {
  console.error(`No catalog for ${unknown.join(", ")}. Catalogs: ${codes.join(", ")}.`);
  process.exit(2);
}

const allKeys = [...new Set(codes.flatMap((code) => Object.keys(catalogs[code])))];
const placeholders = (text) => [...new Set(String(text).match(/\{[A-Za-z0-9_]+\}/g) || [])].sort().join(" ");
const reference = catalogs.en;

let problems = 0;
for (const code of wanted.length ? wanted : codes) {
  const catalog = catalogs[code];
  const missing = allKeys.filter((key) => !Object.prototype.hasOwnProperty.call(catalog, key));
  const empty = Object.keys(catalog).filter((key) => typeof catalog[key] !== "string" || !catalog[key].trim());
  const mismatched =
    code === "en"
      ? []
      : Object.keys(catalog).filter(
          (key) => key in reference && typeof catalog[key] === "string" && placeholders(catalog[key]) !== placeholders(reference[key])
        );
  problems += missing.length + empty.length + mismatched.length;

  const total = Object.keys(catalog).length;
  const status = missing.length + empty.length + mismatched.length ? "" : " - complete";
  console.log(`${code}: ${total} of ${allKeys.length} keys${status}`);
  missing.forEach((key) => {
    const example = reference[key] ?? catalogs[codes.find((other) => key in catalogs[other])][key];
    console.log(`  missing      ${key}  (en: ${JSON.stringify(example)})`);
  });
  empty.forEach((key) => console.log(`  empty        ${key}`));
  mismatched.forEach((key) =>
    console.log(`  placeholders ${key}: has "${placeholders(catalog[key])}", en has "${placeholders(reference[key])}"`)
  );
}

if (problems) {
  console.log(`\n${problems} problem(s). Missing strings fall back to English in the interface.`);
  process.exit(1);
}
