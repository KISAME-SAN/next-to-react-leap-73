import Database from 'better-sqlite3';

// Database singleton
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database('school.db');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create all tables
  database.exec(`
    -- Global tables (no year_id)
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birth_date DATE,
      birth_place TEXT,
      gender TEXT CHECK(gender IN ('homme', 'femme')),
      student_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      subject TEXT,
      hire_date DATE,
      payment_type TEXT CHECK(payment_type IN ('fixe', 'horaire')) DEFAULT 'fixe',
      salary DECIMAL(10,2),
      hourly_rate DECIMAL(10,2),
      residence TEXT,
      contact_type TEXT CHECK(contact_type IN ('telephone', 'email', 'whatsapp', 'sms')) DEFAULT 'telephone',
      years_experience INTEGER DEFAULT 0,
      nationality TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS guardians (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      relationship TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_guardians (
      student_id TEXT NOT NULL,
      guardian_id TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      PRIMARY KEY (student_id, guardian_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (guardian_id) REFERENCES guardians(id) ON DELETE CASCADE
    );

    -- Academic years reference
    CREATE TABLE IF NOT EXISTS academic_years (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      closed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Per-year tables (all with year_id FK)
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      name TEXT NOT NULL,
      level TEXT,
      description TEXT,
      capacity INTEGER DEFAULT 30,
      main_teacher_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
      FOREIGN KEY (main_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
      UNIQUE(year_id, name)
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'transferred', 'graduated', 'left')) DEFAULT 'active',
      enrollment_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id, year_id) REFERENCES classes(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
      UNIQUE(year_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      name TEXT NOT NULL,
      coefficient DECIMAL(3,1) DEFAULT 1.0,
      is_optional BOOLEAN DEFAULT FALSE,
      language_type TEXT CHECK(language_type IN ('LV1', 'LV2')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
      UNIQUE(year_id, name)
    );

    CREATE TABLE IF NOT EXISTS subject_enrollments (
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      semester TEXT CHECK(semester IN ('premier', 'deuxieme')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (student_id, subject_id, year_id, semester),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id, year_id) REFERENCES subjects(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (class_id, year_id) REFERENCES classes(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS grade_items (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      name TEXT NOT NULL,
      max_points DECIMAL(5,2) DEFAULT 20.0,
      weight DECIMAL(3,1) DEFAULT 1.0,
      term TEXT CHECK(term IN ('premier', 'deuxieme')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (subject_id, year_id) REFERENCES subjects(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (class_id, year_id) REFERENCES classes(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS grades (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      grade_item_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      score DECIMAL(5,2),
      date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (grade_item_id, year_id) REFERENCES grade_items(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
      UNIQUE(year_id, grade_item_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      day_of_week TEXT CHECK(day_of_week IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi')) NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      room TEXT,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (class_id, year_id) REFERENCES classes(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id, year_id) REFERENCES subjects(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      date DATE NOT NULL,
      timetable_block_id TEXT NOT NULL,
      locked BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (class_id, year_id) REFERENCES classes(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (timetable_block_id, year_id) REFERENCES timetable(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
      UNIQUE(year_id, class_id, date, timetable_block_id)
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'retard', 'renvoi')) DEFAULT 'present',
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (session_id, year_id) REFERENCES attendance_sessions(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
      UNIQUE(year_id, session_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS teacher_attendance (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      date DATE NOT NULL,
      timetable_block_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'retard', 'aucun')) DEFAULT 'aucun',
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (timetable_block_id, year_id) REFERENCES timetable(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
      UNIQUE(year_id, teacher_id, date, timetable_block_id)
    );

    -- Payment configuration tables
    CREATE TABLE IF NOT EXISTS fees_per_class (
      year_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      inscription DECIMAL(10,2) DEFAULT 0,
      mensualite DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (year_id, class_id),
      FOREIGN KEY (class_id, year_id) REFERENCES classes(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extra_fees (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
      UNIQUE(year_id, name)
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      periodicity TEXT CHECK(periodicity IN ('monthly', 'yearly')) DEFAULT 'monthly',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
      UNIQUE(year_id, name)
    );

    CREATE TABLE IF NOT EXISTS student_fee_activations (
      student_id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      extra_fee_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (student_id, year_id, extra_fee_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (extra_fee_id, year_id) REFERENCES extra_fees(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_service_activations (
      student_id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      month TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (student_id, year_id, service_id, month),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id, year_id) REFERENCES services(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('inscription', 'mensualite', 'frais', 'service')) NOT NULL,
      class_id TEXT,
      month TEXT,
      item_id TEXT,
      method TEXT,
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id TEXT NOT NULL,
      year_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      class_id TEXT,
      subject_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id, year_id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id, year_id) REFERENCES classes(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id, year_id) REFERENCES subjects(id, year_id) ON DELETE CASCADE,
      FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE CASCADE
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_enrollments_year_student ON enrollments(year_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_year_class ON enrollments(year_id, class_id);
    CREATE INDEX IF NOT EXISTS idx_grades_year_student ON grades(year_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_grades_year_class ON grades(year_id, grade_item_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_year_date ON attendance_records(year_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_payments_year_student ON payments(year_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_payments_year_type ON payments(year_id, type);
    CREATE INDEX IF NOT EXISTS idx_timetable_year_class ON timetable(year_id, class_id);
    CREATE INDEX IF NOT EXISTS idx_timetable_year_teacher ON timetable(year_id, teacher_id);
  `);

  // Create utility views
  database.exec(`
    -- Student history across all years
    CREATE VIEW IF NOT EXISTS student_history AS
    SELECT 
      e.student_id,
      e.year_id,
      e.class_id,
      c.name as class_name,
      ay.name as year_name,
      e.status,
      e.enrollment_date
    FROM enrollments e
    JOIN classes c ON e.class_id = c.id AND e.year_id = c.year_id
    JOIN academic_years ay ON e.year_id = ay.id
    ORDER BY e.year_id, e.enrollment_date;

    -- Fees due per student per year
    CREATE VIEW IF NOT EXISTS fees_due AS
    SELECT 
      e.student_id,
      e.year_id,
      e.class_id,
      COALESCE(fpc.inscription, 0) as inscription_due,
      COALESCE(fpc.mensualite, 0) as mensualite_due
    FROM enrollments e
    LEFT JOIN fees_per_class fpc ON e.class_id = fpc.class_id AND e.year_id = fpc.year_id
    WHERE e.status = 'active';

    -- Payment summary per student
    CREATE VIEW IF NOT EXISTS payment_summary AS
    SELECT 
      p.student_id,
      p.year_id,
      p.type,
      p.class_id,
      p.month,
      p.item_id,
      SUM(p.amount) as total_paid,
      COUNT(*) as payment_count,
      MAX(p.payment_date) as last_payment_date
    FROM payments p
    GROUP BY p.student_id, p.year_id, p.type, p.class_id, p.month, p.item_id;

    -- Student grades summary
    CREATE VIEW IF NOT EXISTS student_grades_summary AS
    SELECT 
      g.student_id,
      g.year_id,
      gi.class_id,
      gi.subject_id,
      gi.term,
      AVG(g.score * gi.weight / gi.max_points * 20) as weighted_average,
      COUNT(g.score) as grade_count
    FROM grades g
    JOIN grade_items gi ON g.grade_item_id = gi.id AND g.year_id = gi.year_id
    WHERE g.score IS NOT NULL
    GROUP BY g.student_id, g.year_id, gi.class_id, gi.subject_id, gi.term;

    -- Attendance summary
    CREATE VIEW IF NOT EXISTS attendance_summary AS
    SELECT 
      ar.student_id,
      ar.year_id,
      ar.status,
      COUNT(*) as count
    FROM attendance_records ar
    GROUP BY ar.student_id, ar.year_id, ar.status;
  `);

  // Insert default academic year if none exists
  const yearCount = database.prepare('SELECT COUNT(*) as count FROM academic_years').get() as { count: number };
  if (yearCount.count === 0) {
    const currentYear = new Date().getFullYear();
    const startYear = new Date().getMonth() >= 8 ? currentYear : currentYear - 1; // September start
    const endYear = startYear + 1;
    
    database.prepare(`
      INSERT INTO academic_years (id, name, start_date, end_date)
      VALUES (?, ?, ?, ?)
    `).run(
      `${startYear}-${endYear}`,
      `Année scolaire ${startYear}-${endYear}`,
      `${startYear}-09-01`,
      `${endYear}-08-31`
    );
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// Utility functions for common operations
export function getCurrentAcademicYear() {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM academic_years 
    WHERE closed = FALSE 
    ORDER BY start_date DESC 
    LIMIT 1
  `).get();
}

export function getAllAcademicYears() {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM academic_years 
    ORDER BY start_date DESC
  `).all();
}