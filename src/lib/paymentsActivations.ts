// Local storage helpers for activations of fees and services per student (namespaced by academic year)
// Default is disabled; we only store active entries

import { getActiveYearId, keyForYear } from "./years";

const isBrowser = typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function write<T>(key: string, value: T) {
  if (!isBrowser) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const KEYS = {
  feeActivations: "studentsFeeActivations", // array of "studentId|feeId"
  serviceActivations: "studentsServiceActivations", // array of "studentId|serviceId|mois"
} as const;

// Fees activations (per active academic year)
export function getActiveFeeKeys(yearId: string = getActiveYearId()): string[] {
  return read<string[]>(keyForYear(KEYS.feeActivations, yearId), []);
}

export function setActiveFeeKeys(keys: string[], yearId: string = getActiveYearId()) {
  write(keyForYear(KEYS.feeActivations, yearId), Array.from(new Set(keys)));
}

export function feeKey(studentId: string, feeId: string) {
  return `${studentId}|${feeId}`;
}

export function isFeeActive(studentId: string, feeId: string, yearId: string = getActiveYearId()) {
  const k = feeKey(studentId, feeId);
  return getActiveFeeKeys(yearId).includes(k);
}

export function setFeeActive(studentId: string, feeId: string, active: boolean, yearId: string = getActiveYearId()) {
  const k = feeKey(studentId, feeId);
  const list = new Set(getActiveFeeKeys(yearId));
  if (active) list.add(k); else list.delete(k);
  setActiveFeeKeys(Array.from(list), yearId);
  return active;
}

export function bulkSetFeeActive(studentIds: string[], feeId: string, active: boolean, yearId: string = getActiveYearId()) {
  const list = new Set(getActiveFeeKeys(yearId));
  for (const sid of studentIds) {
    const k = feeKey(sid, feeId);
    if (active) list.add(k); else list.delete(k);
  }
  setActiveFeeKeys(Array.from(list), yearId);
}

// Services activations (month-specific, per academic year)
export function getActiveServiceKeys(yearId: string = getActiveYearId()): string[] {
  return read<string[]>(keyForYear(KEYS.serviceActivations, yearId), []);
}

export function setActiveServiceKeys(keys: string[], yearId: string = getActiveYearId()) {
  write(keyForYear(KEYS.serviceActivations, yearId), Array.from(new Set(keys)));
}

export function serviceKey(studentId: string, serviceId: string, mois: string) {
  return `${studentId}|${serviceId}|${mois}`;
}

export function isServiceActive(studentId: string, serviceId: string, mois: string, yearId: string = getActiveYearId()) {
  if (!mois) return false;
  const k = serviceKey(studentId, serviceId, mois);
  return getActiveServiceKeys(yearId).includes(k);
}

export function setServiceActive(studentId: string, serviceId: string, mois: string, active: boolean, yearId: string = getActiveYearId()) {
  const k = serviceKey(studentId, serviceId, mois);
  const list = new Set(getActiveServiceKeys(yearId));
  if (active) list.add(k); else list.delete(k);
  setActiveServiceKeys(Array.from(list), yearId);
  return active;
}

export function bulkSetServiceActive(studentIds: string[], serviceId: string, mois: string, active: boolean, yearId: string = getActiveYearId()) {
  const list = new Set(getActiveServiceKeys(yearId));
  for (const sid of studentIds) {
    const k = serviceKey(sid, serviceId, mois);
    if (active) list.add(k); else list.delete(k);
  }
  setActiveServiceKeys(Array.from(list), yearId);
}
