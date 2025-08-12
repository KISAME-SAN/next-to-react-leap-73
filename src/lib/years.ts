// Compatibility layer - delegates to adapters for SQLite/localStorage
export * from './adapters/yearsAdapter';

// Re-export types for compatibility
export type AcademicYear = {
  id: string;
  nom: string;
  debut: string;
  fin: string;
  closed?: boolean;
};
