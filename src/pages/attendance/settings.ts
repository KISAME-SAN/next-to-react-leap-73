export type SpecialDayType = 'holiday' | 'celebration';
export interface SpecialDay { id: string; date: string; type: SpecialDayType; appliesToAll: boolean; classIds?: string[] }
export interface AttendanceSettings { lockFutureDays: boolean; specials: SpecialDay[] }

const STORAGE_KEY = 'attendanceSettings';

export function loadSettings(): AttendanceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lockFutureDays: false, specials: [] };
    const parsed = JSON.parse(raw);
    return { lockFutureDays: Boolean(parsed.lockFutureDays), specials: Array.isArray(parsed.specials) ? parsed.specials : [] };
  } catch {
    return { lockFutureDays: false, specials: [] };
  }
}

export function saveSettings(settings: AttendanceSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
