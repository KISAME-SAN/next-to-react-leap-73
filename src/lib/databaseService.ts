import { StudentsRepository } from './repositories/studentsRepository';
import { TeachersRepository } from './repositories/teachersRepository';
import { ClassesRepository } from './repositories/classesRepository';
import { GradesRepository } from './repositories/gradesRepository';
import { PaymentsRepository } from './repositories/paymentsRepository';
import { AttendanceRepository } from './repositories/attendanceRepository';
import { TimetableRepository } from './repositories/timetableRepository';
import { AcademicYearsRepository } from './repositories/academicYearsRepository';
import { MigrationService } from './migrationService';

// Centralized database service
export class DatabaseService {
  public students = new StudentsRepository();
  public teachers = new TeachersRepository();
  public classes = new ClassesRepository();
  public grades = new GradesRepository();
  public payments = new PaymentsRepository();
  public attendance = new AttendanceRepository();
  public timetable = new TimetableRepository();
  public academicYears = new AcademicYearsRepository();
  public migration = new MigrationService();

  // Utility methods
  getCurrentYear() {
    return this.academicYears.getCurrentAcademicYear();
  }

  getAllYears() {
    return this.academicYears.getAllAcademicYears();
  }

  // Transaction wrapper
  transaction<T>(fn: () => T): T {
    const db = this.students['db']; // Access the database instance
    const transaction = db.transaction(fn);
    return transaction();
  }

  // Backup and restore
  exportData(): string {
    const data = {
      academic_years: this.academicYears.getAllAcademicYears(),
      students: this.students.getAllStudents(),
      teachers: this.teachers.getAllTeachers(),
      // Add other exports as needed
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Health check
  isHealthy(): boolean {
    try {
      const year = this.getCurrentYear();
      return year !== null;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const db = new DatabaseService();