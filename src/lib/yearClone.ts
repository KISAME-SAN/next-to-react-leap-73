// Yearly data cloning utility
// Clones all namespaced localStorage keys from one academic year to another.
// After cloning, it purges per-year rosters (enrollments and teacher assignments)
// in the target year to start with empty students/teachers for that year.

import { keyForYear } from "./years";

// Base keys reserved for internal management; we now clone everything
const EXCLUDED_YEAR_KEYS = new Set<string>([]);

export function cloneYearData(fromYearId: string, toYearId: string) {
  if (typeof window === "undefined") return;
  if (!fromYearId || !toYearId || fromYearId === toYearId) return;
  try {
    // Copy all namespaced keys from fromYearId to toYearId
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i) as string;
      if (!key) continue;
      const suffix = `__${fromYearId}`;
      if (!key.endsWith(suffix)) continue;
      const baseKey = key.slice(0, -suffix.length);
      // Write to new year (do not overwrite if already exists)
      const newKey = `${baseKey}__${toYearId}`;
      const value = window.localStorage.getItem(key);
      if (value !== null && !window.localStorage.getItem(newKey)) {
        window.localStorage.setItem(newKey, value);
      }
    }

    // Purge per-year rosters for the new year
    const purgeKeys = ["enrollments", "teacherAssignments"];
    for (const base of purgeKeys) {
      const targetKey = keyForYear(base, toYearId);
      try {
        window.localStorage.setItem(targetKey, JSON.stringify([]));
      } catch {}
    }
  } catch {
    // silent
  }
}

export { EXCLUDED_YEAR_KEYS };
