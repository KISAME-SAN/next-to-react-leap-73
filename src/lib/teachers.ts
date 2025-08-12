// Teachers registry (global) + yearly assignments (localStorage)
import { getActiveYearId, keyForYear } from "./years";

export type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  subject?: string;
};

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
  teachers: "teachers", // existing global registry
  assignments: "teacherAssignments", // per-year: array of teacherId strings
} as const;

export function getTeachers(): Teacher[] {
  const arr = read<any[]>(KEYS.teachers, []);
  if (!Array.isArray(arr)) return [];
  return arr.map((t) => ({
    id: String(t.id),
    firstName: String((t as any).firstName || (t as any).prenom || ""),
    lastName: String((t as any).lastName || (t as any).nom || ""),
    email: (t as any).email,
    phone: (t as any).phone,
    subject: (t as any).subject,
  }));
}

export function getAssignedTeacherIds(yearId: string = getActiveYearId()): string[] {
  return read<string[]>(keyForYear(KEYS.assignments, yearId), []);
}
export function setAssignedTeacherIds(ids: string[], yearId: string = getActiveYearId()) {
  write(keyForYear(KEYS.assignments, yearId), Array.from(new Set(ids)));
}
export function isTeacherAssigned(teacherId: string, yearId: string = getActiveYearId()) {
  return getAssignedTeacherIds(yearId).includes(teacherId);
}
export function setTeacherAssigned(teacherId: string, assigned: boolean, yearId: string = getActiveYearId()) {
  const set = new Set(getAssignedTeacherIds(yearId));
  if (assigned) set.add(teacherId); else set.delete(teacherId);
  setAssignedTeacherIds(Array.from(set), yearId);
  return assigned;
}
