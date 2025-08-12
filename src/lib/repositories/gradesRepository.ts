import { getDatabase } from '../database';

export interface Subject {
  id: string;
  year_id: string;
  name: string;
  coefficient: number;
  is_optional: boolean;
  language_type?: 'LV1' | 'LV2';
  created_at?: string;
}

export interface SubjectEnrollment {
  student_id: string;
  subject_id: string;
  year_id: string;
  class_id: string;
  semester: 'premier' | 'deuxieme';
  created_at?: string;
}

export interface GradeItem {
  id: string;
  year_id: string;
  subject_id: string;
  class_id: string;
  name: string;
  max_points: number;
  weight: number;
  term: 'premier' | 'deuxieme';
  created_at?: string;
}

export interface Grade {
  id: string;
  year_id: string;
  grade_item_id: string;
  student_id: string;
  score?: number;
  date: string;
  created_at?: string;
}

export class GradesRepository {
  private db = getDatabase();

  // Subjects
  createSubject(subject: Omit<Subject, 'created_at'>): Subject {
    const stmt = this.db.prepare(`
      INSERT INTO subjects (id, year_id, name, coefficient, is_optional, language_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      subject.id,
      subject.year_id,
      subject.name,
      subject.coefficient,
      subject.is_optional,
      subject.language_type || null
    );

    return this.getSubjectById(subject.id, subject.year_id)!;
  }

  getSubjectById(id: string, yearId: string): Subject | null {
    const stmt = this.db.prepare('SELECT * FROM subjects WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as Subject | null;
  }

  getSubjectsByYear(yearId: string): Subject[] {
    const stmt = this.db.prepare('SELECT * FROM subjects WHERE year_id = ? ORDER BY name');
    return stmt.all(yearId) as Subject[];
  }

  // Subject enrollments
  enrollStudentInSubject(enrollment: SubjectEnrollment): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO subject_enrollments (student_id, subject_id, year_id, class_id, semester)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      enrollment.student_id,
      enrollment.subject_id,
      enrollment.year_id,
      enrollment.class_id,
      enrollment.semester
    );
  }

  getStudentSubjects(studentId: string, yearId: string, semester: 'premier' | 'deuxieme'): Subject[] {
    const stmt = this.db.prepare(`
      SELECT s.*
      FROM subjects s
      JOIN subject_enrollments se ON s.id = se.subject_id AND s.year_id = se.year_id
      WHERE se.student_id = ? AND se.year_id = ? AND se.semester = ?
      ORDER BY s.name
    `);
    return stmt.all(studentId, yearId, semester) as Subject[];
  }

  // Grade items
  createGradeItem(gradeItem: Omit<GradeItem, 'created_at'>): GradeItem {
    const stmt = this.db.prepare(`
      INSERT INTO grade_items (id, year_id, subject_id, class_id, name, max_points, weight, term)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      gradeItem.id,
      gradeItem.year_id,
      gradeItem.subject_id,
      gradeItem.class_id,
      gradeItem.name,
      gradeItem.max_points,
      gradeItem.weight,
      gradeItem.term
    );

    return this.getGradeItemById(gradeItem.id, gradeItem.year_id)!;
  }

  getGradeItemById(id: string, yearId: string): GradeItem | null {
    const stmt = this.db.prepare('SELECT * FROM grade_items WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as GradeItem | null;
  }

  getGradeItemsByClass(classId: string, yearId: string, term: 'premier' | 'deuxieme'): GradeItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM grade_items 
      WHERE class_id = ? AND year_id = ? AND term = ?
      ORDER BY subject_id, name
    `);
    return stmt.all(classId, yearId, term) as GradeItem[];
  }

  // Grades
  createOrUpdateGrade(grade: Omit<Grade, 'created_at'>): Grade {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO grades (id, year_id, grade_item_id, student_id, score, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      grade.id,
      grade.year_id,
      grade.grade_item_id,
      grade.student_id,
      grade.score || null,
      grade.date
    );

    return this.getGradeById(grade.id, grade.year_id)!;
  }

  getGradeById(id: string, yearId: string): Grade | null {
    const stmt = this.db.prepare('SELECT * FROM grades WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as Grade | null;
  }

  getStudentGrades(studentId: string, yearId: string): Grade[] {
    const stmt = this.db.prepare(`
      SELECT g.*, gi.name as grade_item_name, gi.max_points, gi.weight, s.name as subject_name
      FROM grades g
      JOIN grade_items gi ON g.grade_item_id = gi.id AND g.year_id = gi.year_id
      JOIN subjects s ON gi.subject_id = s.id AND gi.year_id = s.year_id
      WHERE g.student_id = ? AND g.year_id = ?
      ORDER BY s.name, gi.name
    `);
    return stmt.all(studentId, yearId) as Grade[];
  }

  getClassGrades(classId: string, yearId: string, term: 'premier' | 'deuxieme'): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        g.*,
        gi.name as grade_item_name,
        gi.max_points,
        gi.weight,
        s.name as subject_name,
        st.first_name,
        st.last_name
      FROM grades g
      JOIN grade_items gi ON g.grade_item_id = gi.id AND g.year_id = gi.year_id
      JOIN subjects s ON gi.subject_id = s.id AND gi.year_id = s.year_id
      JOIN students st ON g.student_id = st.id
      WHERE gi.class_id = ? AND g.year_id = ? AND gi.term = ?
      ORDER BY st.last_name, st.first_name, s.name, gi.name
    `);
    return stmt.all(classId, yearId, term);
  }

  // Calculate student averages
  getStudentAverages(studentId: string, yearId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM student_grades_summary 
      WHERE student_id = ? AND year_id = ?
    `);
    return stmt.all(studentId, yearId);
  }

  // Generate next IDs
  getNextSubjectId(yearId: string): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM subjects 
      WHERE year_id = ? AND id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get(yearId) as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }

  getNextGradeItemId(yearId: string): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM grade_items 
      WHERE year_id = ? AND id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get(yearId) as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }

  getNextGradeId(yearId: string): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM grades 
      WHERE year_id = ? AND id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get(yearId) as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }
}