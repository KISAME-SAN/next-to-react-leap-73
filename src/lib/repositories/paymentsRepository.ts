import { getDatabase } from '../database';

export interface FeesPerClass {
  year_id: string;
  class_id: string;
  inscription: number;
  mensualite: number;
  created_at?: string;
}

export interface ExtraFee {
  id: string;
  year_id: string;
  name: string;
  amount: number;
  created_at?: string;
}

export interface Service {
  id: string;
  year_id: string;
  name: string;
  amount: number;
  periodicity: 'monthly' | 'yearly';
  created_at?: string;
}

export interface Payment {
  id: string;
  year_id: string;
  student_id: string;
  type: 'inscription' | 'mensualite' | 'frais' | 'service';
  class_id?: string;
  month?: string;
  item_id?: string;
  method?: string;
  amount: number;
  payment_date: string;
  created_at?: string;
}

export interface StudentFeeActivation {
  student_id: string;
  year_id: string;
  extra_fee_id: string;
  created_at?: string;
}

export interface StudentServiceActivation {
  student_id: string;
  year_id: string;
  service_id: string;
  month: string;
  created_at?: string;
}

export class PaymentsRepository {
  private db = getDatabase();

  // Fees per class
  setFeesPerClass(feesPerClass: FeesPerClass): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO fees_per_class (year_id, class_id, inscription, mensualite)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      feesPerClass.year_id,
      feesPerClass.class_id,
      feesPerClass.inscription,
      feesPerClass.mensualite
    );
  }

  getFeesPerClass(yearId: string, classId: string): FeesPerClass | null {
    const stmt = this.db.prepare('SELECT * FROM fees_per_class WHERE year_id = ? AND class_id = ?');
    return stmt.get(yearId, classId) as FeesPerClass | null;
  }

  getAllFeesPerClass(yearId: string): FeesPerClass[] {
    const stmt = this.db.prepare('SELECT * FROM fees_per_class WHERE year_id = ?');
    return stmt.all(yearId) as FeesPerClass[];
  }

  // Extra fees
  createExtraFee(extraFee: Omit<ExtraFee, 'created_at'>): ExtraFee {
    const stmt = this.db.prepare(`
      INSERT INTO extra_fees (id, year_id, name, amount)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(extraFee.id, extraFee.year_id, extraFee.name, extraFee.amount);
    return this.getExtraFeeById(extraFee.id, extraFee.year_id)!;
  }

  getExtraFeeById(id: string, yearId: string): ExtraFee | null {
    const stmt = this.db.prepare('SELECT * FROM extra_fees WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as ExtraFee | null;
  }

  getExtraFeesByYear(yearId: string): ExtraFee[] {
    const stmt = this.db.prepare('SELECT * FROM extra_fees WHERE year_id = ? ORDER BY name');
    return stmt.all(yearId) as ExtraFee[];
  }

  updateExtraFee(id: string, yearId: string, updates: Partial<ExtraFee>): boolean {
    const fields = Object.keys(updates).filter(k => !['id', 'year_id', 'created_at'].includes(k));
    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE extra_fees SET ${setClause} WHERE id = ? AND year_id = ?`);
    const result = stmt.run(...values, id, yearId);
    return result.changes > 0;
  }

  deleteExtraFee(id: string, yearId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM extra_fees WHERE id = ? AND year_id = ?');
    const result = stmt.run(id, yearId);
    return result.changes > 0;
  }

  // Services
  createService(service: Omit<Service, 'created_at'>): Service {
    const stmt = this.db.prepare(`
      INSERT INTO services (id, year_id, name, amount, periodicity)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(service.id, service.year_id, service.name, service.amount, service.periodicity);
    return this.getServiceById(service.id, service.year_id)!;
  }

  getServiceById(id: string, yearId: string): Service | null {
    const stmt = this.db.prepare('SELECT * FROM services WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as Service | null;
  }

  getServicesByYear(yearId: string): Service[] {
    const stmt = this.db.prepare('SELECT * FROM services WHERE year_id = ? ORDER BY name');
    return stmt.all(yearId) as Service[];
  }

  updateService(id: string, yearId: string, updates: Partial<Service>): boolean {
    const fields = Object.keys(updates).filter(k => !['id', 'year_id', 'created_at'].includes(k));
    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as any)[f]);
    
    const stmt = this.db.prepare(`UPDATE services SET ${setClause} WHERE id = ? AND year_id = ?`);
    const result = stmt.run(...values, id, yearId);
    return result.changes > 0;
  }

  deleteService(id: string, yearId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM services WHERE id = ? AND year_id = ?');
    const result = stmt.run(id, yearId);
    return result.changes > 0;
  }

  // Activations
  activateExtraFeeForStudent(activation: StudentFeeActivation): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO student_fee_activations (student_id, year_id, extra_fee_id)
      VALUES (?, ?, ?)
    `);
    stmt.run(activation.student_id, activation.year_id, activation.extra_fee_id);
  }

  deactivateExtraFeeForStudent(studentId: string, yearId: string, extraFeeId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM student_fee_activations 
      WHERE student_id = ? AND year_id = ? AND extra_fee_id = ?
    `);
    stmt.run(studentId, yearId, extraFeeId);
  }

  isExtraFeeActiveForStudent(studentId: string, yearId: string, extraFeeId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM student_fee_activations 
      WHERE student_id = ? AND year_id = ? AND extra_fee_id = ?
    `);
    const result = stmt.get(studentId, yearId, extraFeeId) as { count: number };
    return result.count > 0;
  }

  activateServiceForStudent(activation: StudentServiceActivation): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO student_service_activations (student_id, year_id, service_id, month)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(activation.student_id, activation.year_id, activation.service_id, activation.month);
  }

  deactivateServiceForStudent(studentId: string, yearId: string, serviceId: string, month: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM student_service_activations 
      WHERE student_id = ? AND year_id = ? AND service_id = ? AND month = ?
    `);
    stmt.run(studentId, yearId, serviceId, month);
  }

  isServiceActiveForStudent(studentId: string, yearId: string, serviceId: string, month: string): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM student_service_activations 
      WHERE student_id = ? AND year_id = ? AND service_id = ? AND month = ?
    `);
    const result = stmt.get(studentId, yearId, serviceId, month) as { count: number };
    return result.count > 0;
  }

  // Payments
  createPayment(payment: Omit<Payment, 'created_at'>): Payment {
    const stmt = this.db.prepare(`
      INSERT INTO payments (id, year_id, student_id, type, class_id, month, item_id, method, amount, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      payment.id,
      payment.year_id,
      payment.student_id,
      payment.type,
      payment.class_id || null,
      payment.month || null,
      payment.item_id || null,
      payment.method || null,
      payment.amount,
      payment.payment_date
    );

    return this.getPaymentById(payment.id, payment.year_id)!;
  }

  getPaymentById(id: string, yearId: string): Payment | null {
    const stmt = this.db.prepare('SELECT * FROM payments WHERE id = ? AND year_id = ?');
    return stmt.get(id, yearId) as Payment | null;
  }

  getStudentPayments(studentId: string, yearId: string): Payment[] {
    const stmt = this.db.prepare(`
      SELECT * FROM payments 
      WHERE student_id = ? AND year_id = ?
      ORDER BY payment_date DESC
    `);
    return stmt.all(studentId, yearId) as Payment[];
  }

  getPaymentSummary(studentId: string, yearId: string, type: string, filters: any = {}) {
    let query = `
      SELECT * FROM payment_summary 
      WHERE student_id = ? AND year_id = ? AND type = ?
    `;
    const params = [studentId, yearId, type];

    if (filters.class_id) {
      query += ' AND class_id = ?';
      params.push(filters.class_id);
    }
    if (filters.month) {
      query += ' AND month = ?';
      params.push(filters.month);
    }
    if (filters.item_id) {
      query += ' AND item_id = ?';
      params.push(filters.item_id);
    }

    const stmt = this.db.prepare(query);
    return stmt.get(...params);
  }

  // Generate next payment ID
  getNextPaymentId(yearId: string): string {
    const stmt = this.db.prepare(`
      SELECT CAST(id AS INTEGER) as num_id 
      FROM payments 
      WHERE year_id = ? AND id GLOB '[0-9]*' 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 1
    `);
    const result = stmt.get(yearId) as { num_id: number } | null;
    return String((result?.num_id || 0) + 1);
  }
}