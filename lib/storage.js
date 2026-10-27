import { isCurrentStoredRef } from "./hadith";

// localStorage helpers that never throw (private mode, quota, bad JSON).

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // storage unavailable: keep working in memory
  }
}

// Entries saved by the previous version of the app point at ids of the
// retired API, which are different hadiths in the current one. They are moved
// to `legacy_<key>` (kept, never shown) instead of being resolved by id.
export function splitLegacy(entries) {
  const list = Array.isArray(entries) ? entries : [];
  return {
    current: list.filter(isCurrentStoredRef),
    legacy: list.filter((entry) => !isCurrentStoredRef(entry)),
  };
}

export function archiveLegacy(key, legacy) {
  if (!legacy || (Array.isArray(legacy) && !legacy.length)) return;
  const archiveKey = `legacy_${key}`;
  const existing = readJson(archiveKey, null);
  if (Array.isArray(legacy)) {
    writeJson(archiveKey, [...(Array.isArray(existing) ? existing : []), ...legacy]);
  } else {
    const merged = { ...(existing && typeof existing === "object" ? existing : {}) };
    Object.entries(legacy).forEach(([folder, items]) => {
      merged[folder] = [...(merged[folder] || []), ...items];
    });
    writeJson(archiveKey, merged);
  }
}

export function archivedCount(key) {
  const archived = readJson(`legacy_${key}`, null);
  if (Array.isArray(archived)) return archived.length;
  if (archived && typeof archived === "object") {
    return Object.values(archived).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
  }
  return 0;
}
