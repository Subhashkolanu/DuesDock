import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Budget } from '@/types/database.types';

// Local storage key for offline/development fallback when Supabase credentials are not yet configured
const LOCAL_BUDGETS_KEY = 'duesdock_local_budgets';

function getLocalBudgets(userId: string): Budget[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_BUDGETS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalBudgets(userId: string, budgets: Budget[]): void {
  try {
    localStorage.setItem(`${LOCAL_BUDGETS_KEY}_${userId}`, JSON.stringify(budgets));
  } catch {
    // Ignore storage quota errors
  }
}

export const budgetService = {
  /**
   * Fetch all category budgets for the authenticated user for a specific month (YYYY-MM)
   * Enforces PostgreSQL RLS on user_id
   */
  async getBudgets(userId: string, month: string): Promise<Budget[]> {
    if (!isSupabaseConfigured()) {
      const all = getLocalBudgets(userId);
      return all.filter((b) => b.month === month);
    }

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month);

    if (error) {
      console.error('Error fetching budgets from Supabase:', error.message);
      const all = getLocalBudgets(userId);
      return all.filter((b) => b.month === month);
    }

    return (data as Budget[]) || [];
  },

  /**
   * Save or update a category budget for a specific month.
   * Prevents duplicates for the same user, category, and month.
   */
  async saveBudget(
    userId: string,
    categoryId: string,
    month: string,
    budgetLimit: number,
    budgetId?: string
  ): Promise<Budget> {
    if (budgetLimit < 0) {
      throw new Error('Budget limit cannot be negative.');
    }

    if (!isSupabaseConfigured()) {
      const all = getLocalBudgets(userId);
      // Check if existing budget for this category and month exists
      const existingIndex = all.findIndex(
        (b) => (budgetId && b.id === budgetId) || (b.category_id === categoryId && b.month === month)
      );

      if (existingIndex !== -1) {
        all[existingIndex] = {
          ...all[existingIndex],
          budget_limit: budgetLimit,
        };
        setLocalBudgets(userId, all);
        return all[existingIndex];
      }

      const newBudget: Budget = {
        id: `bgt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        user_id: userId,
        category_id: categoryId,
        month,
        budget_limit: budgetLimit,
        created_at: new Date().toISOString(),
      };
      all.push(newBudget);
      setLocalBudgets(userId, all);
      return newBudget;
    }

    // Live Supabase operation
    if (budgetId) {
      const { data, error } = await supabase
        .from('budgets')
        .update({ budget_limit: budgetLimit })
        .eq('id', budgetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    }

    // Check for duplicate in live database before inserting
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('month', month)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('budgets')
        .update({ budget_limit: budgetLimit })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as Budget;
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: userId,
        category_id: categoryId,
        month,
        budget_limit: budgetLimit,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Budget;
  },

  /**
   * Delete a category budget (verifying user ownership via RLS)
   */
  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const all = getLocalBudgets(userId);
      const filtered = all.filter((b) => b.id !== budgetId);
      setLocalBudgets(userId, filtered);
      return;
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Update overall monthly budget target on the user's profile
   */
  async updateOverallTarget(userId: string, target: number): Promise<void> {
    if (target < 0) {
      throw new Error('Target budget cannot be negative.');
    }

    if (!isSupabaseConfigured()) {
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        monthly_budget_target: target,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },
};
