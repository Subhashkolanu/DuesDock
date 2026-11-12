import type { TransactionType } from '@/types/database.types';

export interface CategoryDefinition {
  id?: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_system: boolean;
}

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#F59E0B', is_system: true },
  { name: 'Groceries', type: 'expense', icon: 'ShoppingCart', color: '#10B981', is_system: true },
  { name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#6366F1', is_system: true },
  { name: 'Utilities & Bills', type: 'expense', icon: 'Zap', color: '#06B6D4', is_system: true },
  { name: 'Transportation', type: 'expense', icon: 'Car', color: '#EC4899', is_system: true },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8B5CF6', is_system: true },
  { name: 'Health & Fitness', type: 'expense', icon: 'Activity', color: '#EF4444', is_system: true },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#F97316', is_system: true },
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#059669', is_system: true },
  { name: 'Freelance / Side Gig', type: 'income', icon: 'Laptop', color: '#14B8A6', is_system: true },
  { name: 'Investments / Dividends', type: 'income', icon: 'TrendingUp', color: '#3B82F6', is_system: true },
  { name: 'Other Expense', type: 'expense', icon: 'MoreHorizontal', color: '#64748B', is_system: true },
];
