// Registre global des élèves + inscriptions par année (localStorage)
import { getActiveYearId, keyForYear, listYears } from "./years";

export type Student = {
  id: string; // immuable sur toute la scolarité
  firstName: string;
  lastName: string;
  birthDate?: string;
  birthPlace?: string;
  contact?: string;
  gender?: string;
  // Champs legacy possibles
  classId?: string; // pour compatibilité avec anciennes données
};

export type Enrollment = {
  studentId: string;
  yearId: string;
  classId: string;
  status?: "active" | "transferred" | "graduated" | "left";
  date?: string; // ISO
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
  students: "students", // registre global existant
  enrollments: "enrollments", // namespacé par année
} as const;

export function getStudents(): Student[] {
  const arr = read<any[]>(KEYS.students, []);
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => ({
    id: String(s.id),
    firstName: String((s as any).firstName ?? (s as any).prenom ?? ""),
    lastName: String((s as any).lastName ?? (s as any).nom ?? ""),
    birthDate: (s as any).birthDate,
    birthPlace: (s as any).birthPlace,
    contact: (s as any).contact,
    gender: (s as any).gender,
    classId: (s as any).classId,
  }));
}

export function upsertStudent(student: Student) {
  const list = getStudents();
  const idx = list.findIndex((s) => s.id === student.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...student };
  else list.push(student);
  write(KEYS.students, list);
}

export function getEnrollments(yearId?: string): Enrollment[] {
  const y = yearId || getActiveYearId();
  return read<Enrollment[]>(keyForYear(KEYS.enrollments, y), []);
}
export function saveEnrollments(list: Enrollment[], yearId?: string) {
  const y = yearId || getActiveYearId();
  write(keyForYear(KEYS.enrollments, y), list);
}

export function getEnrollmentForStudent(studentId: string, yearId?: string): Enrollment | undefined {
  const list = getEnrollments(yearId);
  return list.find((e) => e.studentId === studentId);
}

export function enrollStudent({ studentId, classId, yearId }: { studentId: string; classId: string; yearId?: string }) {
  const y = yearId || getActiveYearId();
  const list = getEnrollments(y);
  const idx = list.findIndex((e) => e.studentId === studentId);
  const now = new Date().toISOString();
  const rec: Enrollment = { studentId, yearId: y, classId, status: "active", date: now };
  if (idx >= 0) list[idx] = { ...list[idx], ...rec };
  else list.push(rec);
  saveEnrollments(list, y);
  // compat: on peut laisser intouché la clé legacy "classId" sur students
  return rec;
}

export function getStudentHistory(studentId: string): Enrollment[] {
  const years = listYears();
  const all: Enrollment[] = [];
  years.forEach((y) => {
    const list = getEnrollments(y.id);
    const e = list.find((r) => r.studentId === studentId);
    if (e) all.push(e);
  });
  return all.sort((a, b) => a.yearId.localeCompare(b.yearId));
}
