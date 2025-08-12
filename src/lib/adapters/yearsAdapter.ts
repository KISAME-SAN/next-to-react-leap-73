import { db } from '../databaseService';

export function listYears() {
  try {
    if (db.isHealthy()) {
      const years = db.academicYears.getAllAcademicYears();
      return years.map(y => ({
        id: y.id,
        nom: y.name,
        debut: y.start_date,
        fin: y.end_date,
        closed: y.closed
      }));
    }
  } catch (error) {
    console.warn('SQLite not available, falling back to localStorage');
  }
  
  // Fallback to localStorage
  return JSON.parse(localStorage.getItem('academicYears') || '[]');
}

export function getActiveYearId(): string {
  try {
    if (db.isHealthy()) {
      const currentYear = db.academicYears.getCurrentAcademicYear();
      if (currentYear) {
        return currentYear.id;
      }
    }
  } catch (error) {
    console.warn('SQLite not available, falling back to localStorage');
  }
  
  // Fallback to localStorage
  return localStorage.getItem('activeYearId') || '2024-2025';
}

export function setActiveYear(id: string) {
  // Always update localStorage for UI state
  localStorage.setItem('activeYearId', id);
  
  try {
    if (db.isHealthy()) {
      // In SQLite, we don't need a separate "active" concept
      // The UI will use the selected year
    }
  } catch (error) {
    console.warn('SQLite not available');
  }
  
  // Notify listeners
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'activeYearId', 
        newValue: id 
      } as any));
    }, 0);
  }
}

export function addYear(input?: any) {
  const currentYear = new Date().getFullYear();
  const startYear = new Date().getMonth() >= 8 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;
  
  const year = {
    id: input?.id || `${startYear}-${endYear}`,
    name: input?.nom || input?.name || `Année scolaire ${startYear}-${endYear}`,
    start_date: input?.debut || input?.start_date || `${startYear}-09-01`,
    end_date: input?.fin || input?.end_date || `${endYear}-08-31`,
    closed: input?.closed || false
  };

  try {
    if (db.isHealthy()) {
      const created = db.academicYears.createAcademicYear(year);
      setActiveYear(created.id);
      return {
        id: created.id,
        nom: created.name,
        debut: created.start_date,
        fin: created.end_date,
        closed: created.closed
      };
    }
  } catch (error) {
    console.warn('SQLite not available, falling back to localStorage');
  }
  
  // Fallback to localStorage
  const years = JSON.parse(localStorage.getItem('academicYears') || '[]');
  const legacyYear = {
    id: year.id,
    nom: year.name,
    debut: year.start_date,
    fin: year.end_date,
    closed: year.closed
  };
  
  const existing = years.find((y: any) => y.id === legacyYear.id);
  if (!existing) {
    years.push(legacyYear);
    localStorage.setItem('academicYears', JSON.stringify(years));
  }
  
  setActiveYear(legacyYear.id);
  return legacyYear;
}

export function ensureDefaultYear() {
  const years = listYears();
  if (years.length === 0) {
    return addYear();
  }
  
  const activeId = getActiveYearId();
  if (!years.find((y: any) => y.id === activeId)) {
    setActiveYear(years[0].id);
  }
  
  return years[0];
}

export function keyForYear(baseKey: string, yearId?: string) {
  const year = yearId || getActiveYearId();
  return `${baseKey}__${year}`;
}