import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Payment, PaymentRecord, PaymentDirection, PaymentStatus, PaymentMethod } from '@/types/database.types';

const LOCAL_PAYMENTS_KEY = 'duesdock_local_payments';
const LOCAL_PAYMENT_RECORDS_KEY = 'duesdock_local_payment_records';

export const PAYMENT_UPDATED_EVENT = 'duesdock_payment_updated';

export function notifyPaymentUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PAYMENT_UPDATED_EVENT));
  }
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computePaymentStatus(
  totalAmount: number,
  paidAmount: number,
  dueDate: string,
  currentStatus: PaymentStatus
): PaymentStatus {
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }
  const total = Number(totalAmount);
  const paid = Number(paidAmount);
  const today = getTodayString();

  if (paid >= total && total > 0) {
    return 'paid';
  }
  if (dueDate < today) {
    return 'overdue';
  }
  if (paid > 0) {
    return 'partially_paid';
  }
  return 'pending';
}

function getLocalPayments(userId: string): Payment[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_PAYMENTS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalPayments(userId: string, payments: Payment[]): void {
  try {
    localStorage.setItem(`${LOCAL_PAYMENTS_KEY}_${userId}`, JSON.stringify(payments));
  } catch {
    // Ignore quota errors
  }
}

function getLocalPaymentRecords(userId: string): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_PAYMENT_RECORDS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalPaymentRecords(userId: string, records: PaymentRecord[]): void {
  try {
    localStorage.setItem(`${LOCAL_PAYMENT_RECORDS_KEY}_${userId}`, JSON.stringify(records));
  } catch {
    // Ignore quota errors
  }
}

export const paymentService = {
  /**
   * Fetch all payment obligations for the authenticated user
   */
  async getPayments(userId: string): Promise<Payment[]> {
    if (!isSupabaseConfigured()) {
      const local = getLocalPayments(userId);
      return local.map((p) => ({
        ...p,
        status: computePaymentStatus(p.total_amount, p.paid_amount, p.due_date, p.status),
      }));
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching payments from Supabase, falling back to local:', error.message);
      const local = getLocalPayments(userId);
      return local.map((p) => ({
        ...p,
        status: computePaymentStatus(p.total_amount, p.paid_amount, p.due_date, p.status),
      }));
    }

    return (data || []).map((p: any) => ({
      ...p,
      status: computePaymentStatus(p.total_amount, p.paid_amount, p.due_date, p.status),
    }));
  },

  /**
   * Fetch payment installments/history for a specific payment obligation
   */
  async getPaymentRecords(userId: string, paymentId: string): Promise<PaymentRecord[]> {
    if (!isSupabaseConfigured()) {
      const all = getLocalPaymentRecords(userId);
      return all.filter((r) => r.payment_id === paymentId);
    }

    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_id', paymentId)
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching payment records, falling back to local:', error.message);
      const all = getLocalPaymentRecords(userId);
      return all.filter((r) => r.payment_id === paymentId);
    }

    return (data as PaymentRecord[]) || [];
  },

  /**
   * Create a new payment obligation (Payable or Receivable)
   */
  async createPayment(
    userId: string,
    payment: {
      title: string;
      party_name: string;
      direction: PaymentDirection;
      total_amount: number;
      due_date: string;
      category_id?: string | null;
      notes?: string | null;
    }
  ): Promise<Payment> {
    if (payment.total_amount <= 0) {
      throw new Error('Total amount must be greater than zero.');
    }
    if (!payment.title.trim()) {
      throw new Error('Payment title is required.');
    }
    if (!payment.party_name.trim()) {
      throw new Error('Party or merchant name is required.');
    }
    if (!payment.due_date) {
      throw new Error('Due date is required.');
    }

    const initialStatus = computePaymentStatus(payment.total_amount, 0, payment.due_date, 'pending');

    if (!isSupabaseConfigured()) {
      const newPayment: Payment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        user_id: userId,
        title: payment.title.trim(),
        party_name: payment.party_name.trim(),
        direction: payment.direction,
        total_amount: Number(payment.total_amount),
        paid_amount: 0,
        due_date: payment.due_date,
        category_id: payment.category_id || null,
        status: initialStatus,
        notes: payment.notes?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const existing = getLocalPayments(userId);
      setLocalPayments(userId, [newPayment, ...existing]);
      notifyPaymentUpdated();
      return newPayment;
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        title: payment.title.trim(),
        party_name: payment.party_name.trim(),
        direction: payment.direction,
        total_amount: payment.total_amount,
        paid_amount: 0,
        due_date: payment.due_date,
        category_id: payment.category_id || null,
        status: initialStatus,
        notes: payment.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.warn('Error saving payment to Supabase, saving locally:', error.message);
      const newPayment: Payment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        user_id: userId,
        title: payment.title.trim(),
        party_name: payment.party_name.trim(),
        direction: payment.direction,
        total_amount: Number(payment.total_amount),
        paid_amount: 0,
        due_date: payment.due_date,
        category_id: payment.category_id || null,
        status: initialStatus,
        notes: payment.notes?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const existing = getLocalPayments(userId);
      setLocalPayments(userId, [newPayment, ...existing]);
      notifyPaymentUpdated();
      return newPayment;
    }

    notifyPaymentUpdated();
    return data as Payment;
  },

  /**
   * Update an existing payment obligation
   */
  async updatePayment(
    userId: string,
    id: string,
    updates: Partial<Omit<Payment, 'id' | 'user_id' | 'created_at'>>
  ): Promise<Payment> {
    if (updates.total_amount !== undefined && updates.total_amount <= 0) {
      throw new Error('Total amount must be greater than zero.');
    }

    if (!isSupabaseConfigured()) {
      const existing = getLocalPayments(userId);
      const index = existing.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Payment not found');
      const item = existing[index];
      const updatedTotal = updates.total_amount !== undefined ? Number(updates.total_amount) : item.total_amount;
      const updatedPaid = updates.paid_amount !== undefined ? Number(updates.paid_amount) : item.paid_amount;
      const updatedDueDate = updates.due_date || item.due_date;
      const updatedStatus = updates.status || computePaymentStatus(updatedTotal, updatedPaid, updatedDueDate, item.status);

      const updatedItem: Payment = {
        ...item,
        ...updates,
        total_amount: updatedTotal,
        paid_amount: updatedPaid,
        due_date: updatedDueDate,
        status: updatedStatus,
        updated_at: new Date().toISOString(),
      };
      existing[index] = updatedItem;
      setLocalPayments(userId, existing);
      notifyPaymentUpdated();
      return updatedItem;
    }

    const { data, error } = await supabase
      .from('payments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.warn('Error updating payment in Supabase, updating locally:', error.message);
      const existing = getLocalPayments(userId);
      const index = existing.findIndex((p) => p.id === id);
      if (index !== -1) {
        existing[index] = { ...existing[index], ...updates, updated_at: new Date().toISOString() };
        setLocalPayments(userId, existing);
      }
      notifyPaymentUpdated();
      return existing[index];
    }

    notifyPaymentUpdated();
    return data as Payment;
  },

  /**
   * Record a partial or full payment installment against an obligation
   */
  async recordPaymentInstallment(
    userId: string,
    paymentId: string,
    installment: {
      amount: number;
      payment_date: string;
      payment_method: PaymentMethod;
      notes?: string | null;
    }
  ): Promise<{ payment: Payment; record: PaymentRecord }> {
    const amount = Number(installment.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    // Fetch the target payment
    const payments = await this.getPayments(userId);
    const targetPayment = payments.find((p) => p.id === paymentId);
    if (!targetPayment) {
      throw new Error('Payment obligation not found.');
    }

    const currentPaid = Number(targetPayment.paid_amount);
    const total = Number(targetPayment.total_amount);
    const remaining = total - currentPaid;

    if (amount > remaining + 0.001) {
      throw new Error(
        `Payment amount (${amount}) exceeds remaining outstanding balance (${Math.max(0, remaining).toFixed(2)}).`
      );
    }

    const newPaidAmount = currentPaid + amount;
    const newStatus = computePaymentStatus(total, newPaidAmount, targetPayment.due_date, targetPayment.status);

    const recordId = `prec-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newRecord: PaymentRecord = {
      id: recordId,
      payment_id: paymentId,
      user_id: userId,
      amount,
      payment_date: installment.payment_date,
      payment_method: installment.payment_method,
      notes: installment.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const records = getLocalPaymentRecords(userId);
      setLocalPaymentRecords(userId, [newRecord, ...records]);

      const updatedPayment: Payment = {
        ...targetPayment,
        paid_amount: newPaidAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      const updatedPayments = payments.map((p) => (p.id === paymentId ? updatedPayment : p));
      setLocalPayments(userId, updatedPayments);
      notifyPaymentUpdated();
      return { payment: updatedPayment, record: newRecord };
    }

    // Insert record in Supabase
    const { data: recordData, error: recordError } = await supabase
      .from('payment_records')
      .insert({
        payment_id: paymentId,
        user_id: userId,
        amount,
        payment_date: installment.payment_date,
        payment_method: installment.payment_method,
        notes: installment.notes?.trim() || null,
      })
      .select()
      .single();

    if (recordError) {
      console.warn('Error inserting payment record in Supabase, falling back locally:', recordError.message);
      const records = getLocalPaymentRecords(userId);
      setLocalPaymentRecords(userId, [newRecord, ...records]);
      const updatedPayment = await this.updatePayment(userId, paymentId, {
        paid_amount: newPaidAmount,
        status: newStatus,
      });
      notifyPaymentUpdated();
      return { payment: updatedPayment, record: newRecord };
    }

    // Update parent payment in Supabase
    const { data: updatedPaymentData, error: paymentError } = await supabase
      .from('payments')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (paymentError) throw paymentError;

    notifyPaymentUpdated();
    return {
      payment: updatedPaymentData as Payment,
      record: recordData as PaymentRecord,
    };
  },

  /**
   * Delete a payment installment and restore the outstanding balance
   */
  async deletePaymentRecord(userId: string, paymentId: string, recordId: string): Promise<Payment> {
    const records = await this.getPaymentRecords(userId, paymentId);
    const targetRecord = records.find((r) => r.id === recordId);
    if (!targetRecord) {
      throw new Error('Payment installment record not found.');
    }

    const payments = await this.getPayments(userId);
    const targetPayment = payments.find((p) => p.id === paymentId);
    if (!targetPayment) {
      throw new Error('Parent payment not found.');
    }

    const newPaidAmount = Math.max(0, Number(targetPayment.paid_amount) - Number(targetRecord.amount));
    const newStatus = computePaymentStatus(
      targetPayment.total_amount,
      newPaidAmount,
      targetPayment.due_date,
      targetPayment.status
    );

    if (!isSupabaseConfigured()) {
      const allRecords = getLocalPaymentRecords(userId);
      setLocalPaymentRecords(userId, allRecords.filter((r) => r.id !== recordId));
      const updatedPayment: Payment = {
        ...targetPayment,
        paid_amount: newPaidAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      setLocalPayments(userId, payments.map((p) => (p.id === paymentId ? updatedPayment : p)));
      notifyPaymentUpdated();
      return updatedPayment;
    }

    const { error: delError } = await supabase
      .from('payment_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);

    if (delError) throw delError;

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    notifyPaymentUpdated();
    return updatedPayment as Payment;
  },

  /**
   * Delete a payment obligation and all its installments
   */
  async deletePayment(userId: string, id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const existing = getLocalPayments(userId);
      setLocalPayments(userId, existing.filter((p) => p.id !== id));
      const records = getLocalPaymentRecords(userId);
      setLocalPaymentRecords(userId, records.filter((r) => r.payment_id !== id));
      notifyPaymentUpdated();
      return;
    }

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.warn('Error deleting payment from Supabase, removing locally:', error.message);
      const existing = getLocalPayments(userId);
      setLocalPayments(userId, existing.filter((p) => p.id !== id));
    }

    notifyPaymentUpdated();
  },
};
