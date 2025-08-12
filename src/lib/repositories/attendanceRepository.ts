import { getDatabase } from '../database';

export interface AttendanceSession {
  id: string;
  year_id: string;
  class_id: string;
  date: string;
  timetable_block_id: string;
  locked: boolean;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  year_id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'retard' | 'renvoi';
  comment?: string;
  created_at?: string;
}

export interface TeacherAttendance {
  id: string;
  year_id: string;
  teacher_id: string;
  date: string;
  timetable_block_id: string;
  status: 'present' | 'absent' | 'retard' | 'aucun';
  comment?: string;
  created_at?: string;
}

export class AttendanceRepository {
  private db = getDatabase();

  // Attendance sessions
  createAttendanceSession(session: Omit<AttendanceSession, 'created_at'>): AttendanceSession {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO attendance_sessions (id, year_id, class_id, date, timetable_block_id, locked)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      session.id,
      session.year_id,
      session.class_id,
      session.date,
      session.timetable_block_id,
      session.locked
    );

    return this.getAttendanceSessionById(session.id, session.year_id)!;
  }

  getAttendanceSessionById(id: string, yearId: string): AttendanceSession | null {
    const stmt = this.db.prepare('SELECT * FROM attendance_sessions WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as AttendanceSession | null;
  }

  getAttendanceSessionByDetails(yearId: string, classId: string, date: string, timetableBlockId: string): AttendanceSession | null {
    const stmt = this.db.prepare(`
      SELECT * FROM attendance_sessions 
      WHERE year_id = ? AND class_id = ? AND date = ? AND timetable_block_id = ?
    `);
    return stmt.get(yearId, classId, date, timetableBlockId) as AttendanceSession | null;
  }

  // Student attendance records
  createOrUpdateAttendanceRecord(record: Omit<AttendanceRecord, 'created_at'>): AttendanceRecord {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO attendance_records (id, year_id, session_id, student_id, status, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      record.id,
      record.year_id,
      record.session_id,
      record.student_id,
      record.status,
      record.comment || null
    );

    return this.getAttendanceRecordById(record.id, record.year_id)!;
  }

  getAttendanceRecordById(id: string, yearId: string): AttendanceRecord | null {
    const stmt = this.db.prepare('SELECT * FROM attendance_records WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as AttendanceRecord | null;
  }

  getAttendanceRecordsBySession(sessionId: string, yearId: string): AttendanceRecord[] {
    const stmt = this.db.prepare(`
      SELECT ar.*, s.first_name, s.last_name
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = ? AND ar.year_id = ?
      ORDER BY s.last_name, s.first_name
    `);
    return stmt.all(sessionId, yearId) as AttendanceRecord[];
  }

  getStudentAttendanceSummary(studentId: string, yearId: string) {
    const stmt = this.db.prepare(`
      SELECT * FROM attendance_summary 
      WHERE student_id = ? AND year_id = ?
    `);
    return stmt.all(studentId, yearId);
  }

  // Teacher attendance
  createOrUpdateTeacherAttendance(attendance: Omit<TeacherAttendance, 'created_at'>): TeacherAttendance {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO teacher_attendance (id, year_id, teacher_id, date, timetable_block_id, status, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      attendance.id,
      attendance.year_id,
      attendance.teacher_id,
      attendance.date,
      attendance.timetable_block_id,
      attendance.status,
      attendance.comment || null
    );

    return this.getTeacherAttendanceById(attendance.id, attendance.year_id)!;
  }

  getTeacherAttendanceById(id: string, yearId: string): TeacherAttendance | null {
    const stmt = this.db.prepare('SELECT * FROM teacher_attendance WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as TeacherAttendance | null;
  }

  getTeacherAttendanceByDetails(yearId: string, teacherId: string, date: string, timetableBlockId: string): TeacherAttendance | null {
    const stmt = this.db.prepare(`
      SELECT * FROM teacher_attendance 
      WHERE year_id = ? AND teacher_id = ? AND date = ? AND timetable_block_id = ?
    `);
    return stmt.get(yearId, teacherId, date, timetableBlockId) as TeacherAttendance | null;
  }

  // Generate next IDs
  getNextAttendanceSessionId(yearId: string): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM attendance_sessions 
      WHERE year_id = ? AND id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get(yearId) as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }

  getNextAttendanceRecordId(yearId: string): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM attendance_records 
      WHERE year_id = ? AND id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get(yearId) as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }
}