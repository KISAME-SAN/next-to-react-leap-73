import { getDatabase } from '../database';

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  closed: boolean;
  created_at?: string;
}

export class AcademicYearsRepository {
  private db = getDatabase();

  createAcademicYear(year: Omit<AcademicYear, 'created_at'>): AcademicYear {
    const stmt = this.db.prepare(`
      INSERT INTO academic_years (id, name, start_date, end_date, closed)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(year.id, year.name, year.start_date, year.end_date, year.closed);
    return this.getAcademicYearById(year.id)!;
  }

  getAcademicYearById(id: string): AcademicYear | null {
    const stmt = this.db.prepare('SELECT * FROM academic_years WHERE id = ?');
    return stmt.get(id) as AcademicYear | null;
  }

  getAllAcademicYears(): AcademicYear[] {
    const stmt = this.db.prepare('SELECT * FROM academic_years ORDER BY start_date DESC');
    return stmt.all() as AcademicYear[];
  }

  getCurrentAcademicYear(): AcademicYear | null {
    const stmt = this.db.prepare(`
      SELECT * FROM academic_years 
      WHERE closed = FALSE 
      ORDER BY start_date DESC 
      LIMIT 1
    `);
    return stmt.get() as AcademicYear | null;
  }

  updateAcademicYear(id: string, updates: Partial<AcademicYear>): boolean {
    const fields = Object.keys(updates).filter(k => !['id', 'created_at'].includes(k));
    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE academic_years SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  closeAcademicYear(id: string): boolean {
    return this.updateAcademicYear(id, { closed: true });
  }

  deleteAcademicYear(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM academic_years WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Data migration utilities
  copyYearConfiguration(fromYearId: string, toYearId: string): void {
    const transaction = this.db.transaction(() => {
      // Copy fees per class
      this.db.prepare(`
        INSERT OR REPLACE INTO fees_per_class (year_id, class_id, inscription, mensualite)
        SELECT ?, class_id, inscription, mensualite
        FROM fees_per_class
        WHERE year_id = ?
      `).run(toYearId, fromYearId);

      // Copy extra fees
      this.db.prepare(`
        INSERT OR REPLACE INTO extra_fees (id, year_id, name, amount)
        SELECT id, ?, name, amount
        FROM extra_fees
        WHERE year_id = ?
      `).run(toYearId, fromYearId);

      // Copy services
      this.db.prepare(`
        INSERT OR REPLACE INTO services (id, year_id, name, amount, periodicity)
        SELECT id, ?, name, amount, periodicity
        FROM services
        WHERE year_id = ?
      `).run(toYearId, fromYearId);

      // Copy subjects
      this.db.prepare(`
        INSERT OR REPLACE INTO subjects (id, year_id, name, coefficient, is_optional, language_type)
        SELECT id, ?, name, coefficient, is_optional, language_type
        FROM subjects
        WHERE year_id = ?
      `).run(toYearId, fromYearId);
    });

    transaction();
  }
}