import { getDatabase } from './database';
import { StudentsRepository } from './repositories/studentsRepository';
import { TeachersRepository } from './repositories/teachersRepository';
import { ClassesRepository } from './repositories/classesRepository';
import { PaymentsRepository } from './repositories/paymentsRepository';
import { AcademicYearsRepository } from './repositories/academicYearsRepository';

export class MigrationService {
  private studentsRepo = new StudentsRepository();
  private teachersRepo = new TeachersRepository();
  private classesRepo = new ClassesRepository();
  private paymentsRepo = new PaymentsRepository();
  private yearsRepo = new AcademicYearsRepository();

  async migrateFromLocalStorage(): Promise<void> {
    console.log('Starting migration from localStorage to SQLite...');

    try {
      // Migrate academic years first
      await this.migrateAcademicYears();
      
      // Migrate global entities
      await this.migrateStudents();
      await this.migrateTeachers();
      
      // Migrate per-year data
      await this.migrateClasses();
      await this.migrateEnrollments();
      await this.migratePaymentConfiguration();
      await this.migratePayments();
      
      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async migrateAcademicYears(): Promise<void> {
    const years = this.getFromLocalStorage('academicYears', []);
    
    for (const year of years) {
      try {
        this.yearsRepo.createAcademicYear({
          id: year.id,
          name: year.nom || year.name,
          start_date: year.debut || year.start_date,
          end_date: year.fin || year.end_date,
          closed: year.closed || false
        });
      } catch (error) {
        console.warn(`Failed to migrate academic year ${year.id}:`, error);
      }
    }
  }

  private async migrateStudents(): Promise<void> {
    const students = this.getFromLocalStorage('students', []);
    
    for (const student of students) {
      try {
        this.studentsRepo.createStudent({
          id: student.id,
          first_name: student.firstName || student.prenom || '',
          last_name: student.lastName || student.nom || '',
          birth_date: student.birthDate,
          birth_place: student.birthPlace,
          gender: student.gender,
          student_number: student.studentNumber
        });
      } catch (error) {
        console.warn(`Failed to migrate student ${student.id}:`, error);
      }
    }
  }

  private async migrateTeachers(): Promise<void> {
    const teachers = this.getFromLocalStorage('teachers', []);
    
    for (const teacher of teachers) {
      try {
        this.teachersRepo.createTeacher({
          id: teacher.id,
          first_name: teacher.firstName || teacher.prenom || '',
          last_name: teacher.lastName || teacher.nom || '',
          email: teacher.email,
          phone: teacher.phone,
          subject: teacher.subject,
          hire_date: teacher.hireDate,
          payment_type: teacher.paymentType || 'fixe',
          salary: teacher.salary,
          hourly_rate: teacher.hourlyRate,
          residence: teacher.residence,
          contact_type: teacher.contactType || 'telephone',
          years_experience: teacher.yearsExperience || 0,
          nationality: teacher.nationality,
          emergency_contact: teacher.emergencyContact,
          emergency_phone: teacher.emergencyPhone
        });
      } catch (error) {
        console.warn(`Failed to migrate teacher ${teacher.id}:`, error);
      }
    }
  }

  private async migrateClasses(): Promise<void> {
    const classes = this.getFromLocalStorage('classes', []);
    const currentYear = this.yearsRepo.getCurrentAcademicYear();
    
    if (!currentYear) {
      console.warn('No current academic year found, skipping classes migration');
      return;
    }

    for (const cls of classes) {
      try {
        this.classesRepo.createClass({
          id: cls.id,
          year_id: currentYear.id,
          name: cls.name || cls.nom,
          description: cls.description,
          capacity: cls.capacity || 30
        });
      } catch (error) {
        console.warn(`Failed to migrate class ${cls.id}:`, error);
      }
    }
  }

  private async migrateEnrollments(): Promise<void> {
    const students = this.getFromLocalStorage('students', []);
    const currentYear = this.yearsRepo.getCurrentAcademicYear();
    
    if (!currentYear) return;

    // Check for year-specific enrollments
    const enrollmentsKey = `enrollments__${currentYear.id}`;
    const enrollments = this.getFromLocalStorage(enrollmentsKey, []);
    
    if (enrollments.length > 0) {
      // Use year-specific enrollments
      for (const enrollment of enrollments) {
        try {
          this.studentsRepo.enrollStudent({
            id: enrollment.id || `${enrollment.studentId}-${currentYear.id}`,
            student_id: enrollment.studentId,
            class_id: enrollment.classId,
            year_id: currentYear.id,
            status: enrollment.status || 'active',
            enrollment_date: enrollment.date || new Date().toISOString().split('T')[0]
          });
        } catch (error) {
          console.warn(`Failed to migrate enrollment for student ${enrollment.studentId}:`, error);
        }
      }
    } else {
      // Fallback to legacy classId on students
      for (const student of students) {
        if (student.classId) {
          try {
            this.studentsRepo.enrollStudent({
              id: `${student.id}-${currentYear.id}`,
              student_id: student.id,
              class_id: student.classId,
              year_id: currentYear.id,
              status: 'active',
              enrollment_date: new Date().toISOString().split('T')[0]
            });
          } catch (error) {
            console.warn(`Failed to migrate legacy enrollment for student ${student.id}:`, error);
          }
        }
      }
    }
  }

  private async migratePaymentConfiguration(): Promise<void> {
    const currentYear = this.yearsRepo.getCurrentAcademicYear();
    if (!currentYear) return;

    // Migrate fees per class
    const feesKey = `studentFees__${currentYear.id}`;
    const fees = this.getFromLocalStorage(feesKey, {}) || this.getFromLocalStorage('studentFees', {});
    
    for (const [classId, feeData] of Object.entries(fees)) {
      try {
        this.paymentsRepo.setFeesPerClass({
          year_id: currentYear.id,
          class_id: classId,
          inscription: (feeData as any).inscription || 0,
          mensualite: (feeData as any).mensualite || 0
        });
      } catch (error) {
        console.warn(`Failed to migrate fees for class ${classId}:`, error);
      }
    }

    // Migrate extra fees
    const extraFeesKey = `studentsExtraFees__${currentYear.id}`;
    const extraFees = this.getFromLocalStorage(extraFeesKey, []) || this.getFromLocalStorage('studentsExtraFees', []);
    
    for (const fee of extraFees) {
      try {
        this.paymentsRepo.createExtraFee({
          id: fee.id,
          year_id: currentYear.id,
          name: fee.nom || fee.name,
          amount: fee.montant || fee.amount
        });
      } catch (error) {
        console.warn(`Failed to migrate extra fee ${fee.id}:`, error);
      }
    }

    // Migrate services
    const servicesKey = `studentsServices__${currentYear.id}`;
    const services = this.getFromLocalStorage(servicesKey, []) || this.getFromLocalStorage('studentsServices', []);
    
    for (const service of services) {
      try {
        this.paymentsRepo.createService({
          id: service.id,
          year_id: currentYear.id,
          name: service.nom || service.name,
          amount: service.montant || service.amount,
          periodicity: 'monthly'
        });
      } catch (error) {
        console.warn(`Failed to migrate service ${service.id}:`, error);
      }
    }
  }

  private async migratePayments(): Promise<void> {
    const currentYear = this.yearsRepo.getCurrentAcademicYear();
    if (!currentYear) return;

    const paymentsKey = `studentPayments__${currentYear.id}`;
    const payments = this.getFromLocalStorage(paymentsKey, []) || this.getFromLocalStorage('studentPayments', []);
    
    for (const payment of payments) {
      try {
        this.paymentsRepo.createPayment({
          id: payment.id,
          year_id: currentYear.id,
          student_id: payment.studentId,
          type: payment.type,
          class_id: payment.classeId,
          month: payment.mois,
          item_id: payment.itemId,
          method: payment.method,
          amount: payment.amount,
          payment_date: payment.date ? payment.date.split('T')[0] : new Date().toISOString().split('T')[0]
        });
      } catch (error) {
        console.warn(`Failed to migrate payment ${payment.id}:`, error);
      }
    }
  }

  private getFromLocalStorage(key: string, fallback: any): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  // Backup current localStorage data before migration
  backupLocalStorageData(): string {
    const backup: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          backup[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          backup[key] = localStorage.getItem(key);
        }
      }
    }

    return JSON.stringify(backup, null, 2);
  }

  // Clear localStorage after successful migration
  clearLocalStorageData(): void {
    const keysToKeep = ['sidebarHidden', 'activeYearId'];
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}