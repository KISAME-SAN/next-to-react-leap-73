import { db } from '../databaseService';

// Adapter to maintain compatibility with existing components
export function getStudents() {
  try {
    if (db.isHealthy()) {
      const students = db.students.getAllStudents();
      return students.map(s => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        birthDate: s.birth_date,
        birthPlace: s.birth_place,
        gender: s.gender,
        studentNumber: s.student_number,
        parentPhone: '', // Will need to be handled via guardians table
        classId: '' // Will be resolved via enrollments
      }));
    }
  } catch (error) {
    console.warn('SQLite not available, falling back to localStorage');
  }
  
  // Fallback to localStorage
  return JSON.parse(localStorage.getItem('students') || '[]');
}

export function getEnrollments(yearId?: string) {
  try {
    if (db.isHealthy()) {
      const currentYear = yearId || db.getCurrentYear()?.id;
      if (currentYear) {
        return db.students.getEnrollmentsByYear(currentYear);
      }
    }
  } catch (error) {
    console.warn('SQLite not available, falling back to localStorage');
  }
  
  // Fallback to localStorage
  const year = yearId || localStorage.getItem('activeYearId') || '2024-2025';
  return JSON.parse(localStorage.getItem(`enrollments__${year}`) || '[]');
}

export function upsertStudent(student: any) {
  try {
    if (db.isHealthy()) {
      const existing = db.students.getStudentById(student.id);
      if (existing) {
        db.students.updateStudent(student.id, {
          first_name: student.firstName,
          last_name: student.lastName,
          birth_date: student.birthDate,
          birth_place: student.birthPlace,
          gender: student.gender,
          student_number: student.studentNumber
        });
      } else {
        db.students.createStudent({
          id: student.id,
          first_name: student.firstName,
          last_name: student.lastName,
          birth_date: student.birthDate,
          birth_place: student.birthPlace,
          gender: student.gender,
          student_number: student.studentNumber
        });
      }
      return;
    }
  } catch (error) {
    console.warn('SQLite not available, falling back to localStorage');
  }
  
  // Fallback to localStorage
  const students = JSON.parse(localStorage.getItem('students') || '[]');
  const index = students.findIndex((s: any) => s.id === student.id);
  if (index >= 0) {
    students[index] = { ...students[index], ...student };
  } else {
    students.push(student);
  }
  localStorage.setItem('students', JSON.stringify(students));
}

export function enrollStudent({ studentId, classId, yearId }: { studentId: string; classId: string; yearId?: string }) {
  try {
    if (db.isHealthy()) {
      const currentYear = yearId || db.getCurrentYear()?.id;
      if (currentYear) {
        const enrollmentId = `${studentId}-${currentYear}`;
        db.students.enrollStudent({
          id: enrollmentId,
          student_id: studentId,
          class_id: classId,
          year_id: currentYear,
          status: 'active',
          enrollment_date: new Date().toISOString().split('T')[0]
        });
        return;
      }
    }
  } catch (error) {
    console.warn('SQLite not available, falling back to localStorage');
  }
  
  // Fallback to localStorage
  const year = yearId || localStorage.getItem('activeYearId') || '2024-2025';
  const enrollments = JSON.parse(localStorage.getItem(`enrollments__${year}`) || '[]');
  const existing = enrollments.findIndex((e: any) => e.studentId === studentId);
  const enrollment = {
    studentId,
    yearId: year,
    classId,
    status: 'active',
    date: new Date().toISOString()
  };
  
  if (existing >= 0) {
    enrollments[existing] = enrollment;
  } else {
    enrollments.push(enrollment);
  }
  
  localStorage.setItem(`enrollments__${year}`, JSON.stringify(enrollments));
}

export function getStudentHistory(studentId: string) {
  try {
    if (db.isHealthy()) {
      return db.students.getStudentHistory(studentId);
    }
  } catch (error) {
    console.warn('SQLite not available, falling back to localStorage');
  }
  
  // Fallback to localStorage implementation
  const years = JSON.parse(localStorage.getItem('academicYears') || '[]');
  const history: any[] = [];
  
  years.forEach((year: any) => {
    const enrollments = JSON.parse(localStorage.getItem(`enrollments__${year.id}`) || '[]');
    const enrollment = enrollments.find((e: any) => e.studentId === studentId);
    if (enrollment) {
      history.push({
        student_id: studentId,
        year_id: year.id,
        class_id: enrollment.classId,
        class_name: '', // Would need to resolve
        year_name: year.nom || year.name,
        status: enrollment.status || 'active',
        enrollment_date: enrollment.date
      });
    }
  });
  
  return history;
}