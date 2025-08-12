import { getDatabase } from '../database';

export interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  subject?: string;
  hire_date?: string;
  payment_type: 'fixe' | 'horaire';
  salary?: number;
  hourly_rate?: number;
  residence?: string;
  contact_type: 'telephone' | 'email' | 'whatsapp' | 'sms';
  years_experience: number;
  nationality?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  created_at?: string;
}

export interface TeacherAssignment {
  id: string;
  year_id: string;
  teacher_id: string;
  class_id?: string;
  subject_id?: string;
  created_at?: string;
}

export class TeachersRepository {
  private db = getDatabase();

  // Teachers CRUD
  createTeacher(teacher: Omit<Teacher, 'created_at'>): Teacher {
    const stmt = this.db.prepare(`
      INSERT INTO teachers (
        id, first_name, last_name, email, phone, subject, hire_date,
        payment_type, salary, hourly_rate, residence, contact_type,
        years_experience, nationality, emergency_contact, emergency_phone
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      teacher.id,
      teacher.first_name,
      teacher.last_name,
      teacher.email || null,
      teacher.phone || null,
      teacher.subject || null,
      teacher.hire_date || null,
      teacher.payment_type,
      teacher.salary || null,
      teacher.hourly_rate || null,
      teacher.residence || null,
      teacher.contact_type,
      teacher.years_experience,
      teacher.nationality || null,
      teacher.emergency_contact || null,
      teacher.emergency_phone || null
    );

    return this.getTeacherById(teacher.id)!;
  }

  getTeacherById(id: string): Teacher | null {
    const stmt = this.db.prepare('SELECT * FROM teachers WHERE id = ?');
    return stmt.get(id) as Teacher | null;
  }

  getAllTeachers(): Teacher[] {
    const stmt = this.db.prepare('SELECT * FROM teachers ORDER BY last_name, first_name');
    return stmt.all() as Teacher[];
  }

  updateTeacher(id: string, updates: Partial<Teacher>): boolean {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE teachers SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  deleteTeacher(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM teachers WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Teacher assignments
  assignTeacher(assignment: Omit<TeacherAssignment, 'created_at'>): TeacherAssignment {
    const stmt = this.db.prepare(`
      INSERT INTO teacher_assignments (id, year_id, teacher_id, class_id, subject_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      assignment.id,
      assignment.year_id,
      assignment.teacher_id,
      assignment.class_id || null,
      assignment.subject_id || null
    );

    return this.getAssignmentById(assignment.id, assignment.year_id)!;
  }

  getAssignmentById(id: string, yearId: string): TeacherAssignment | null {
    const stmt = this.db.prepare('SELECT * FROM teacher_assignments WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as TeacherAssignment | null;
  }

  getAssignmentsByYear(yearId: string): TeacherAssignment[] {
    const stmt = this.db.prepare('SELECT * FROM teacher_assignments WHERE year_id = ?');
    return stmt.all(yearId) as TeacherAssignment[];
  }

  getAssignedTeachers(yearId: string): Teacher[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT t.*
      FROM teachers t
      JOIN teacher_assignments ta ON t.id = ta.teacher_id
      WHERE ta.year_id = ?
      ORDER BY t.last_name, t.first_name
    `);
    return stmt.all(yearId) as Teacher[];
  }

  isTeacherAssigned(teacherId: string, yearId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM teacher_assignments 
      WHERE teacher_id = ? AND year_id = ?
    `);
    const result = stmt.get(teacherId, yearId) as { count: number };
    return result.count > 0;
  }

  // Generate next teacher ID
  getNextTeacherId(): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM teachers 
      WHERE id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get() as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }
}