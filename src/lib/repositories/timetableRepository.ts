import { getDatabase } from '../database';

export interface TimetableBlock {
  id: string;
  year_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  start_time: string;
  end_time: string;
  room?: string;
  color: string;
  created_at?: string;
}

export class TimetableRepository {
  private db = getDatabase();

  createTimetableBlock(block: Omit<TimetableBlock, 'created_at'>): TimetableBlock {
    const stmt = this.db.prepare(`
      INSERT INTO timetable (id, year_id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      block.id,
      block.year_id,
      block.class_id,
      block.subject_id,
      block.teacher_id,
      block.day_of_week,
      block.start_time,
      block.end_time,
      block.room || null,
      block.color
    );

    return this.getTimetableBlockById(block.id, block.year_id)!;
  }

  getTimetableBlockById(id: string, yearId: string): TimetableBlock | null {
    const stmt = this.db.prepare('SELECT * FROM timetable WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as TimetableBlock | null;
  }

  getTimetableByClass(classId: string, yearId: string): TimetableBlock[] {
    const stmt = this.db.prepare(`
      SELECT t.*, s.name as subject_name, te.first_name as teacher_first_name, te.last_name as teacher_last_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id AND t.year_id = s.year_id
      JOIN teachers te ON t.teacher_id = te.id
      WHERE t.class_id = ? AND t.year_id = ?
      ORDER BY 
        CASE t.day_of_week 
          WHEN 'Lundi' THEN 1 
          WHEN 'Mardi' THEN 2 
          WHEN 'Mercredi' THEN 3 
          WHEN 'Jeudi' THEN 4 
          WHEN 'Vendredi' THEN 5 
          WHEN 'Samedi' THEN 6 
        END,
        t.start_time
    `);
    return stmt.all(classId, yearId) as TimetableBlock[];
  }

  getTimetableByTeacher(teacherId: string, yearId: string): TimetableBlock[] {
    const stmt = this.db.prepare(`
      SELECT t.*, s.name as subject_name, c.name as class_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id AND t.year_id = s.year_id
      JOIN classes c ON t.class_id = c.id AND t.year_id = c.year_id
      WHERE t.teacher_id = ? AND t.year_id = ?
      ORDER BY 
        CASE t.day_of_week 
          WHEN 'Lundi' THEN 1 
          WHEN 'Mardi' THEN 2 
          WHEN 'Mercredi' THEN 3 
          WHEN 'Jeudi' THEN 4 
          WHEN 'Vendredi' THEN 5 
          WHEN 'Samedi' THEN 6 
        END,
        t.start_time
    `);
    return stmt.all(teacherId, yearId) as TimetableBlock[];
  }

  updateTimetableBlock(id: string, yearId: string, updates: Partial<TimetableBlock>): boolean {
    const fields = Object.keys(updates).filter(k => !['id', 'year_id', 'created_at'].includes(k));
    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE timetable SET ${setClause} WHERE id = ? AND year_id = ?`);
    const result = stmt.run(...values, id, yearId);
    return result.changes > 0;
  }

  deleteTimetableBlock(id: string, yearId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM timetable WHERE id = ? AND year_id = ?');
    const result = stmt.run(id, yearId);
    return result.changes > 0;
  }

  // Check for conflicts
  checkTimeConflict(
    yearId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    teacherId?: string,
    classId?: string,
    excludeId?: string
  ): TimetableBlock[] {
    let query = `
      SELECT * FROM timetable 
      WHERE year_id = ? AND day_of_week = ? 
      AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
    `;
    const params = [yearId, dayOfWeek, endTime, startTime, startTime, endTime];

    if (teacherId) {
      query += ' AND teacher_id = ?';
      params.push(teacherId);
    }
    if (classId) {
      query += ' AND class_id = ?';
      params.push(classId);
    }
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as TimetableBlock[];
  }

  // Generate next timetable ID
  getNextTimetableId(yearId: string): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM timetable 
      WHERE year_id = ? AND id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get(yearId) as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }
}