import { getDatabase } from '../database';

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  birth_place?: string;
  gender?: 'homme' | 'femme';
  student_number?: string;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  year_id: string;
  status: 'active' | 'transferred' | 'graduated' | 'left';
  enrollment_date: string;
  created_at?: string;
}

export class StudentsRepository {
  private db = getDatabase();

  // Students CRUD
  createStudent(student: Omit<Student, 'created_at'>): Student {
    const stmt = this.db.prepare(`
      INSERT INTO students (id, first_name, last_name, birth_date, birth_place, gender, student_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      student.id,
      student.first_name,
      student.last_name,
      student.birth_date || null,
      student.birth_place || null,
      student.gender || null,
      student.student_number || null
    );

    return this.getStudentById(student.id)!;
  }

  getStudentById(id: string): Student | null {
    const stmt = this.db.prepare('SELECT * FROM students WHERE id = ?');
    return stmt.get(id) as Student | null;
  }

  getAllStudents(): Student[] {
    const stmt = this.db.prepare('SELECT * FROM students ORDER BY last_name, first_name');
    return stmt.all() as Student[];
  }

  updateStudent(id: string, updates: Partial<Student>): boolean {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE students SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  deleteStudent(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM students WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Enrollments
  enrollStudent(enrollment: Omit<Enrollment, 'created_at'>): Enrollment {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO enrollments (id, student_id, class_id, year_id, status, enrollment_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      enrollment.id,
      enrollment.student_id,
      enrollment.class_id,
      enrollment.year_id,
      enrollment.status,
      enrollment.enrollment_date
    );

    return this.getEnrollmentById(enrollment.id, enrollment.year_id)!;
  }

  getEnrollmentById(id: string, yearId: string): Enrollment | null {
    const stmt = this.db.prepare('SELECT * FROM enrollments WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as Enrollment | null;
  }

  getEnrollmentsByYear(yearId: string): Enrollment[] {
    const stmt = this.db.prepare('SELECT * FROM enrollments WHERE year_id = ? ORDER BY enrollment_date');
    return stmt.all(yearId) as Enrollment[];
  }

  getEnrollmentsByStudent(studentId: string): Enrollment[] {
    const stmt = this.db.prepare('SELECT * FROM enrollments WHERE student_id = ? ORDER BY year_id');
    return stmt.all(studentId) as Enrollment[];
  }

  getStudentsInClass(classId: string, yearId: string): (Student & { enrollment_date: string; status: string })[] {
    const stmt = this.db.prepare(`
      SELECT s.*, e.enrollment_date, e.status
      FROM students s
      JOIN enrollments e ON s.id = e.student_id
      WHERE e.class_id = ? AND e.year_id = ?
      ORDER BY s.last_name, s.first_name
    `);
    return stmt.all(classId, yearId) as (Student & { enrollment_date: string; status: string })[];
  }

  getStudentHistory(studentId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM student_history WHERE student_id = ?
    `);
    return stmt.all(studentId);
  }

  // Generate next student ID
  getNextStudentId(): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM students 
      WHERE id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get() as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }
}