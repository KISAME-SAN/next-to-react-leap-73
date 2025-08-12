// Gestion des années scolaires (localStorage)
// Année active globale + liste des années

export type AcademicYear = {
  id: string; // ex: 2024-2025
  nom: string; // ex: Année scolaire 2024-2025
  debut: string; // ISO date YYYY-MM-DD
  fin: string; // ISO date YYYY-MM-DD
  closed?: boolean;
};

const KEYS = {
  years: "academicYears",
  active: "activeYearId",
} as const;

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

export function listYears(): AcademicYear[] {
  const list = read<AcademicYear[]>(KEYS.years, []);
  return Array.isArray(list) ? list : [];
}
export function saveYears(list: AcademicYear[]) {
  write(KEYS.years, list);
}

export function getActiveYearId(): string {
  let id = read<string | null>(KEYS.active, null) as any;
  if (!id) {
    const y = ensureDefaultYear();
    id = y.id;
  }
  return String(id);
}
export function setActiveYear(id: string) {
  write(KEYS.active, id);
  // notify listeners (async to avoid interfering with UI portals like Radix Select)
  if (isBrowser) {
    try {
      setTimeout(() => {
        try {
          window.dispatchEvent(new StorageEvent("storage", { key: KEYS.active, newValue: id } as any));
        } catch {}
      }, 0);
    } catch {}
  }
}
export function getActiveYear(): AcademicYear | undefined {
  const id = getActiveYearId();
  return listYears().find((y) => y.id === id);
}

export function addYear(input?: Partial<AcademicYear>): AcademicYear {
  const years = listYears();
  const base = createDefaultYear();
  const next: AcademicYear = {
    id: input?.id || base.id,
    nom: input?.nom || base.nom,
    debut: input?.debut || base.debut,
    fin: input?.fin || base.fin,
    closed: input?.closed || false,
  };
  const exists = years.find((y) => y.id === next.id);
  if (!exists) years.push(next);
  saveYears(years);
  if (!read(KEYS.active, null)) setActiveYear(next.id);
  return next;
}

function createDefaultYear(): AcademicYear {
  const today = new Date();
  const month = today.getMonth() + 1; // 1..12
  const year = today.getFullYear();
  // Sept -> Août
  const startYear = month >= 9 ? year : year - 1;
  const endYear = startYear + 1;
  return {
    id: `${startYear}-${endYear}`,
    nom: `Année scolaire ${startYear}-${endYear}`,
    debut: `${startYear}-09-01`,
    fin: `${endYear}-08-31`,
  };
}

export function ensureDefaultYear(): AcademicYear {
  const years = listYears();
  if (years.length === 0) {
    const y = createDefaultYear();
    saveYears([y]);
    setActiveYear(y.id);
    return y;
  }
  const active = read<string | null>(KEYS.active, null);
  if (!active) setActiveYear(years[0].id);
  return years[0];
}

// Utilitaire pour namespacer des clés par année
export function keyForYear(baseKey: string, yearId?: string) {
  const y = yearId || getActiveYearId();
  return `${baseKey}__${y}`;
}
