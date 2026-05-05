import { fetchAllTables } from "@/lib/api";
import * as SEED from "@/data/seed";

const cache = {};
let _ready = false;
let _readyPromise = null;

export function loadFromAPI() {
  if (_readyPromise) return _readyPromise;
  _readyPromise = fetchAllTables()
    .then((map) => {
      Object.entries(map).forEach(([name, rows]) => {
        cache[name] = rows;
      });
      if (!cache.ACADEMIC_RECORDS) cache.ACADEMIC_RECORDS = SEED.ACADEMIC_RECORDS ?? [];
      _ready = true;
      console.log("[db] Loaded from API", Object.keys(cache).map(k => `${k}(${cache[k]?.length})`));
    })
    .catch((err) => {
      console.warn("[db] API unreachable, falling back to seed data:", err);
      Object.keys(SEED).forEach((k) => {
        if (Array.isArray(SEED[k])) cache[k] = structuredClone(SEED[k]);
      });
      _ready = true;
    });
  return _readyPromise;
}

export function isReady() {
  return _ready;
}

export function getTable(table) {
  return cache[table] ?? [];
}

export function setTable(table, rows) {
  cache[table] = rows;
  window.dispatchEvent(new CustomEvent("scms:change", { detail: { table } }));
}

export function updateTable(table, updater) {
  const next = updater(getTable(table));
  setTable(table, next);
  return next;
}

export function resetAll() {
  Object.keys(cache).forEach((k) => delete cache[k]);
  _ready = false;
  _readyPromise = null;
  loadFromAPI().then(() => {
    window.dispatchEvent(new CustomEvent("scms:change", { detail: { table: "*" } }));
  });
}

export const CREDIT_CAP = SEED.CREDIT_CAP;
