import { getDatabase } from '../database';

export interface Class {
  id: string;
  year_id: string;
  name: string;
  level?: string;
  description?: string;
  capacity: number;
  main_teacher_id?: string;
  created_at?: string;
}

export class ClassesRepository {
  private db = getDatabase();

  createClass(classData: Omit<Class, 'created_at'>): Class {
    const stmt = this.db.prepare(`
      INSERT INTO classes (id, year_id, name, level, description, capacity, main_teacher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      classData.id,
      classData.year_id,
      classData.name,
      classData.level || null,
      classData.description || null,
      classData.capacity,
      classData.main_teacher_id || null
    );

    return this.getClassById(classData.id, classData.year_id)!;
  }

  getClassById(id: string, yearId: string): Class | null {
    const stmt = this.db.prepare('SELECT * FROM classes WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as Class | null;
  }

  getClassesByYear(yearId: string): Class[] {
    const stmt = this.db.prepare('SELECT * FROM classes WHERE year_id = ? ORDER BY name');
    return stmt.all(yearId) as Class[];
  }

  updateClass(id: string, yearId: string, updates: Partial<Class>): boolean {
    const fields = Object.keys(updates).filter(k => !['id', 'year_id', 'created_at'].includes(k));
    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE classes SET ${setClause} WHERE id = ? AND year_id = ?`);
    const result = stmt.run(...values, id, yearId);
    return result.changes > 0;
  }

  deleteClass(id: string, yearId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM classes WHERE id = ? AND year_id = ?');
    const result = stmt.run(id, yearId);
    return result.changes > 0;
  }

  getClassWithStudentCount(yearId: string) {
    const stmt = this.db.prepare(`
      SELECT 
        c.*,
        COUNT(e.student_id) as student_count
      FROM classes c
      LEFT JOIN enrollments e ON c.id = e.class_id AND c.year_id = e.year_id AND e.status = 'active'
      WHERE c.year_id = ?
      GROUP BY c.id, c.year_id
      ORDER BY c.name
    `);
    return stmt.all(yearId);
  }

  // Generate next class ID for a year
  getNextClassId(yearId: string): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM classes 
      WHERE year_id = ? AND id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get(yearId) as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }
}