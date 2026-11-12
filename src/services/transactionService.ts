import { supabase, isSupabaseConfigured, uploadReceipt, getReceiptSignedUrl } from '@/lib/supabase';
import type { Transaction, Category, TransactionType, PaymentMethod } from '@/types/database.types';
import { DEFAULT_CATEGORIES } from '@/lib/categories';

// Local storage key for offline/demo development when Supabase credentials are not yet configured
const LOCAL_TX_KEY = 'duesdock_local_transactions';
const LOCAL_CAT_KEY = 'duesdock_local_categories';

function getLocalTransactions(userId: string): Transaction[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_TX_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalTransactions(userId: string, txs: Transaction[]): void {
  try {
    localStorage.setItem(`${LOCAL_TX_KEY}_${userId}`, JSON.stringify(txs));
  } catch {
    // Ignore storage quota errors
  }
}

function getLocalCategories(userId: string): Category[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_CAT_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
    const defaults = DEFAULT_CATEGORIES.map((c, i) => ({
      id: `cat-default-${i}`,
      user_id: null,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      is_system: true,
      created_at: new Date().toISOString(),
    }));
    return defaults;
  } catch {
    return [];
  }
}

function setLocalCategories(userId: string, cats: Category[]): void {
  try {
    localStorage.setItem(`${LOCAL_CAT_KEY}_${userId}`, JSON.stringify(cats));
  } catch {
    // Ignore
  }
}

export const transactionService = {
  /**
   * Fetch all categories (system defaults + user-created custom categories)
   */
  async getCategories(userId: string): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      return getLocalCategories(userId);
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories from Supabase:', error.message);
      // Fallback to local
      return getLocalCategories(userId);
    }

    return (data as Category[]) || [];
  },

  /**
   * Create a new custom category for the user
   */
  async createCategory(
    userId: string,
    category: { name: string; type: TransactionType; color?: string; icon?: string }
  ): Promise<Category> {
    const newCategory: Category = {
      id: isSupabaseConfigured() ? undefined as any : `cat-${Date.now()}`,
      user_id: userId,
      name: category.name.trim(),
      type: category.type,
      icon: category.icon || 'Tag',
      color: category.color || (category.type === 'income' ? '#059669' : '#EC4899'),
      is_system: false,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const existing = getLocalCategories(userId);
      const updated = [...existing, newCategory];
      setLocalCategories(userId, updated);
      return newCategory;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: newCategory.name,
        type: newCategory.type,
        icon: newCategory.icon,
        color: newCategory.color,
        is_system: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  /**
   * Fetch all transactions for the authenticated user (enforcing RLS)
   */
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (!isSupabaseConfigured()) {
      return getLocalTransactions(userId);
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error.message);
      throw error;
    }

    return (data as Transaction[]) || [];
  },

  /**
   * Create a new transaction (Income or Expense)
   */
  async createTransaction(
    userId: string,
    tx: {
      type: TransactionType;
      amount: number;
      category_id: string | null;
      transaction_date: string;
      payment_method: PaymentMethod;
      merchant?: string | null;
      notes?: string | null;
      receipt_path?: string | null;
    }
  ): Promise<Transaction> {
    if (tx.amount <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    if (!isSupabaseConfigured()) {
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        user_id: userId,
        type: tx.type,
        amount: tx.amount,
        category_id: tx.category_id,
        transaction_date: tx.transaction_date,
        payment_method: tx.payment_method,
        merchant: tx.merchant || null,
        notes: tx.notes || null,
        receipt_path: tx.receipt_path || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const existing = getLocalTransactions(userId);
      const updated = [newTx, ...existing];
      setLocalTransactions(userId, updated);
      return newTx;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: tx.type,
        amount: tx.amount,
        category_id: tx.category_id,
        transaction_date: tx.transaction_date,
        payment_method: tx.payment_method,
        merchant: tx.merchant || null,
        notes: tx.notes || null,
        receipt_path: tx.receipt_path || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  /**
   * Update an existing transaction
   */
  async updateTransaction(
    userId: string,
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>
  ): Promise<Transaction> {
    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    if (!isSupabaseConfigured()) {
      const existing = getLocalTransactions(userId);
      const index = existing.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('Transaction not found');
      const updatedItem: Transaction = {
        ...existing[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      existing[index] = updatedItem;
      setLocalTransactions(userId, existing);
      return updatedItem;
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  /**
   * Delete a transaction (verifying user ownership via RLS)
   */
  async deleteTransaction(userId: string, id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const existing = getLocalTransactions(userId);
      const filtered = existing.filter((t) => t.id !== id);
      setLocalTransactions(userId, filtered);
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Validates and uploads a receipt file to private Supabase Storage
   * Allowed types: JPG, PNG, PDF (< 5MB)
   */
  async uploadReceipt(userId: string, file: File): Promise<string> {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Receipts must be in JPG, PNG, or PDF format.');
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      throw new Error('File size exceeds the 5MB maximum limit.');
    }

    if (!isSupabaseConfigured()) {
      // Offline / preview mock path
      return `preview/${file.name}`;
    }

    return await uploadReceipt(file, userId);
  },

  /**
   * Generates a temporary secure signed URL to view/download private receipts
   */
  async getReceiptUrl(path: string): Promise<string | null> {
    if (!path) return null;
    if (path.startsWith('preview/')) {
      return null;
    }
    return await getReceiptSignedUrl(path);
  },
};
