// Local storage helpers for payments configuration
// Keeps a single source of truth for classes, frais annexes and services

import { getActiveYearId, keyForYear } from "./years";

export type Classe = { id: string; nom: string };
export type FraisAnnexe = { id: string; nom: string; montant: number };
export type Service = { id: string; nom: string; montant: number };
export type FeesMap = Record<string, { inscription: number; mensualite: number }>;

const KEYS = {
  classes: "classes",                 // from ClassManagement
  feesPerClass: "studentFees",        // from StudentsConfiguration
  frais: "studentsExtraFees",         // from StudentsFees
  services: "studentsServices",       // from StudentsServices
  payments: "studentPayments",        // new: transactions storage
} as const;

const isBrowser = typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

export function getClasses(): Classe[] {
  const raw = read<any[]>(KEYS.classes, []);
  if (!Array.isArray(raw)) return [];
  // Normalize to { id, nom }
  return raw
    .map((c) => ({ id: String(c.id), nom: String(c.name || c.nom || "") }))
    .filter((c) => c.id && c.nom);
}

// Not used currently; keep for completeness but prefer managing classes via ClassManagement page
export function setClasses(list: { id: string; nom: string }[]) {
  write(KEYS.classes, list);
}

export function getStudentFeesMap(): FeesMap {
  const yearKey = keyForYear(KEYS.feesPerClass, getActiveYearId());
  const fy = read<any>(yearKey, null);
  if (fy && typeof fy === "object") return fy as FeesMap;
  const legacy = read<any>(KEYS.feesPerClass, {});
  if (legacy && typeof legacy === "object") return legacy as FeesMap;
  return {};
}

export function getFeesAnnexes(): FraisAnnexe[] {
  const yKey = keyForYear(KEYS.frais, getActiveYearId());
  const fy = read<FraisAnnexe[] | null>(yKey, null as any);
  if (Array.isArray(fy)) return fy;
  return read<FraisAnnexe[]>(KEYS.frais, []);
}
export function setFeesAnnexes(list: FraisAnnexe[]) {
  write<FraisAnnexe[]>(keyForYear(KEYS.frais, getActiveYearId()), list);
}

export function getServices(): Service[] {
  const yKey = keyForYear(KEYS.services, getActiveYearId());
  const sv = read<Service[] | null>(yKey, null as any);
  if (Array.isArray(sv)) return sv;
  return read<Service[]>(KEYS.services, []);
}
export function setServices(list: Service[]) {
  write<Service[]>(keyForYear(KEYS.services, getActiveYearId()), list);
}

// Copy configuration from one academic year to another (fees map, extra fees, services)
export function copyYearConfig(fromYearId: string, toYearId: string) {
  // fees per class
  const fromFees = read<FeesMap>(keyForYear(KEYS.feesPerClass, fromYearId), {} as any);
  if (fromFees && typeof fromFees === "object") {
    write(keyForYear(KEYS.feesPerClass, toYearId), fromFees);
  }
  // extra fees
  const fromFrais = read<FraisAnnexe[]>(keyForYear(KEYS.frais, fromYearId), []);
  if (Array.isArray(fromFrais)) {
    write(keyForYear(KEYS.frais, toYearId), fromFrais);
  }
  // services
  const fromServices = read<Service[]>(keyForYear(KEYS.services, fromYearId), []);
  if (Array.isArray(fromServices)) {
    write(keyForYear(KEYS.services, toYearId), fromServices);
  }
}

// Payments transactions
export type StudentPayment = {
  id: string;
  studentId: string;
  type: "inscription" | "mensualite" | "frais" | "service";
  classeId?: string;
  mois?: string; // MM
  itemId?: string; // frais/service id
  method?: string;
  amount: number;
  date: string; // ISO
};

export function getStudentPayments(): StudentPayment[] {
  const yKey = keyForYear(KEYS.payments, getActiveYearId());
  const py = read<StudentPayment[] | null>(yKey, null as any);
  if (Array.isArray(py)) return py;
  return read<StudentPayment[]>(KEYS.payments, []);
}

export function addStudentPayment(tx: Omit<StudentPayment, "id" | "date"> & { id?: string; date?: string }) {
  const yKey = keyForYear(KEYS.payments, getActiveYearId());
  const list = read<StudentPayment[]>(yKey, []);
  const next: StudentPayment = {
    id: tx.id || (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now())),
    date: tx.date || new Date().toISOString(),
    ...tx,
  } as StudentPayment;
  list.push(next);
  write(yKey, list);
  return next;
}

export function sumPaidFor(filter: { studentId: string; type: "inscription" | "mensualite" | "frais" | "service"; classeId?: string; mois?: string; itemId?: string }) {
  const list = getStudentPayments().filter((p) =>
    p.studentId === filter.studentId &&
    p.type === filter.type &&
    (filter.classeId ? p.classeId === filter.classeId : true) &&
    (filter.mois ? p.mois === filter.mois : true) &&
    (filter.itemId ? p.itemId === filter.itemId : true)
  );
  const total = list.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const last = list[list.length - 1];
  return { total, last } as { total: number; last?: StudentPayment };
}
