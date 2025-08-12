// Compatibility layer - delegates to adapters for SQLite/localStorage
export * from './adapters/studentsAdapter';

// Re-export types for compatibility
export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  birthPlace?: string;
  contact?: string;
  gender?: string;
  classId?: string;
};

export type Enrollment = {
  studentId: string;
  yearId: string;
  classId: string;
  status?: "active" | "transferred" | "graduated" | "left";
  date?: string;
};