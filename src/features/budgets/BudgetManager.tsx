import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { budgetService } from '@/services/budgetService';
import { transactionService } from '@/services/transactionService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BudgetStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, CURRENCY_SYMBOLS, getCurrentMonthKey } from '@/lib/utils';
import type { Budget, Category, Transaction, CurrencyCode } from '@/types/database.types';
import {
  PieChart,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  PiggyBank,
  Sparkles,
} from 'lucide-react';

export const BudgetManager: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const currency: CurrencyCode = profile?.preferred_currency || 'USD';

  // Active month: 'YYYY-MM' (default to current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());

  // Data
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string>('');
  const [modalBudgetLimit, setModalBudgetLimit] = useState<string>('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Overall Target Edit Modal
  const [isOverallModalOpen, setIsOverallModalOpen] = useState(false);
  const [overallLimitInput, setOverallLimitInput] = useState<string>(
    String(profile?.monthly_budget_target || 0)
  );
  const [isSavingOverall, setIsSavingOverall] = useState(false);

  // Delete Confirm
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [bData, cData, tData] = await Promise.all([
        budgetService.getBudgets(user.id, selectedMonth),
        transactionService.getCategories(user.id),
        transactionService.getTransactions(user.id),
      ]);
      setBudgets(bData);
      setCategories(cData);
      setTransactions(tData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load budget data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, selectedMonth]);

  // Overall Target
  const overallTarget = profile?.monthly_budget_target || 0;

  // Actual transactions in the selected month
  const monthExpenseTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'expense' && t.transaction_date.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  const totalSpentInMonth = useMemo(() => {
    return monthExpenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [monthExpenseTransactions]);

  const overallRemaining = overallTarget - totalSpentInMonth;
  const overallPercentUsed = overallTarget > 0 ? (totalSpentInMonth / overallTarget) * 100 : 0;

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonthDisplay = (monthKey: string) => {
    const [y, m] = monthKey.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Expense categories available for budgeting
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Handle Category Budget Save
  const handleSaveCategoryBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const limitNum = parseFloat(modalBudgetLimit);
    if (isNaN(limitNum) || limitNum < 0) {
      setErrorMessage('Please enter a valid positive budget limit.');
      return;
    }

    try {
      setIsSavingBudget(true);
      await budgetService.saveBudget(
        user.id,
        modalCategoryId,
        selectedMonth,
        limitNum,
        editingBudget?.id
      );
      setIsCategoryModalOpen(false);
      setEditingBudget(null);
      setModalBudgetLimit('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save budget');
    } finally {
      setIsSavingBudget(false);
    }
  };

  // Handle Overall Target Save
  const handleSaveOverallTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const targetNum = parseFloat(overallLimitInput);
    if (isNaN(targetNum) || targetNum < 0) {
      setErrorMessage('Please enter a valid positive target limit.');
      return;
    }

    try {
      setIsSavingOverall(true);
      await budgetService.updateOverallTarget(user.id, targetNum);
      await updateProfile({ monthly_budget_target: targetNum });
      setIsOverallModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update monthly target');
    } finally {
      setIsSavingOverall(false);
    }
  };

  // Handle Budget Delete
  const handleDeleteBudget = async (id: string) => {
    if (!user) return;
    try {
      setIsDeleting(true);
      await budgetService.deleteBudget(user.id, id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      setDeletingBudget(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete budget');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open modal for editing
  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setModalCategoryId(b.category_id);
    setModalBudgetLimit(String(b.budget_limit));
    setIsCategoryModalOpen(true);
  };

  // Open modal for new budget
  const handleOpenNewBudget = () => {
    setEditingBudget(null);
    // Find first category not already budgeted for this month
    const unbudgeted = expenseCategories.find(
      (c) => !budgets.some((b) => b.category_id === c.id)
    );
    setModalCategoryId(unbudgeted ? unbudgeted.id : expenseCategories[0]?.id || '');
    setModalBudgetLimit('500');
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Budgets & Spending Limits
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set monthly category spending caps, prevent budget overruns, and track savings cushions.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-800 px-3 min-w-[130px] text-center">
            {formatMonthDisplay(selectedMonth)}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Notice</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 1. OVERALL MONTHLY BUDGET CARD */}
      <Card className="p-6 bg-gradient-to-br from-white to-slate-50/50 border-slate-200 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                Overall Spending Cap
              </span>
              <BudgetStatusBadge percentage={overallPercentUsed} />
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-2">
              {formatMonthDisplay(selectedMonth)} Budget
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Across all categories: {formatCurrency(totalSpentInMonth, currency)} spent of{' '}
              {formatCurrency(overallTarget, currency)} target
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOverallLimitInput(String(overallTarget));
              setIsOverallModalOpen(true);
            }}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Overall Target
          </Button>
        </div>

        {/* Progress Bar & Warning State */}
        <div className="pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-600">
              {Math.round(overallPercentUsed)}% Utilized
            </span>
            <span
              className={`font-mono font-bold ${
                overallRemaining >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {overallRemaining >= 0
                ? `${formatCurrency(overallRemaining, currency)} remaining`
                : `Over budget by ${formatCurrency(Math.abs(overallRemaining), currency)}`}
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                overallPercentUsed >= 100
                  ? 'bg-rose-600'
                  : overallPercentUsed >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, overallPercentUsed)}%` }}
            />
          </div>

          {overallPercentUsed >= 100 ? (
            <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Budget exceeded! You have surpassed your planned spending ceiling for this month.</span>
            </p>
          ) : overallPercentUsed >= 80 ? (
            <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Warning: You have used over 80% of your monthly budget.</span>
            </p>
          ) : (
            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>On track. Spending is within your designated monthly target.</span>
            </p>
          )}
        </div>
      </Card>

      {/* 2. CATEGORY BUDGETS HEADER & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600" />
            Category-Specific Budgets
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual spending limits per expense category for {formatMonthDisplay(selectedMonth)}.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenNewBudget}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Set Category Budget
        </Button>
      </div>

      {/* Category Budgets Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading monthly category budgets...</span>
        </div>
      ) : budgets.length === 0 ? (
        /* Empty State */
        <Card className="p-10 text-center space-y-3 bg-white border-dashed border-2 border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Category Budgets for {formatMonthDisplay(selectedMonth)}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Set dedicated limits for Groceries, Dining, Rent, or Entertainment to track specific expenditure caps.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenNewBudget}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Category Budget
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const category = categories.find((c) => c.id === b.category_id);
            const catName = category?.name || 'Uncategorized';
            const catColor = category?.color || '#059669';

            // Calculate spent in this category for this month
            const spentInCategory = monthExpenseTransactions
              .filter((t) => t.category_id === b.category_id)
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const remaining = b.budget_limit - spentInCategory;
            const percentUsed = b.budget_limit > 0 ? (spentInCategory / b.budget_limit) * 100 : 0;

            return (
              <Card key={b.id} hoverEffect className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <h3 className="font-bold text-slate-900 text-sm">{catName}</h3>
                    </div>
                    <BudgetStatusBadge percentage={percentUsed} />
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="text-xl font-mono font-black text-slate-900">
                      {formatCurrency(spentInCategory, currency)}
                    </div>
                    <p className="text-xs text-slate-500">
                      of {formatCurrency(b.budget_limit, currency)} limit
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          percentUsed >= 100
                            ? 'bg-rose-600'
                            : percentUsed >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, percentUsed)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>{Math.round(percentUsed)}% spent</span>
                      <span className={remaining >= 0 ? 'text-emerald-700' : 'text-rose-600 font-bold'}>
                        {remaining >= 0
                          ? `${formatCurrency(remaining, currency)} left`
                          : `Over by ${formatCurrency(Math.abs(remaining), currency)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit Limit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingBudget(b)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Set Category Budget Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingBudget(null);
        }}
        title={editingBudget ? 'Edit Category Budget' : 'Set Category Budget'}
        description={`Configure monthly limit for ${formatMonthDisplay(selectedMonth)}.`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveCategoryBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Expense Category
            </label>
            <select
              value={modalCategoryId}
              onChange={(e) => setModalCategoryId(e.target.value)}
              disabled={Boolean(editingBudget)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
              required
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {editingBudget && (
              <p className="text-[11px] text-slate-400 mt-1">
                Category cannot be changed while editing. Create a new budget for other categories.
              </p>
            )}
          </div>

          <Input
            label={`Budget Limit (${CURRENCY_SYMBOLS[currency]})`}
            type="number"
            min="0"
            step="10"
            placeholder="e.g. 500"
            value={modalBudgetLimit}
            onChange={(e) => setModalBudgetLimit(e.target.value)}
            leftElement={
              <span className="font-bold text-slate-500 font-mono">
                {CURRENCY_SYMBOLS[currency]}
              </span>
            }
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSavingBudget}
            >
              {editingBudget ? 'Save Changes' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Overall Target Modal */}
      <Modal
        isOpen={isOverallModalOpen}
        onClose={() => setIsOverallModalOpen(false)}
        title="Edit Overall Monthly Spending Target"
        description="Defines your baseline target ceiling across all expenses."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveOverallTarget} className="space-y-4">
          <Input
            label={`Monthly Budget Target (${CURRENCY_SYMBOLS[currency]})`}
            type="number"
            min="0"
            step="50"
            value={overallLimitInput}
            onChange={(e) => setOverallLimitInput(e.target.value)}
            leftElement={
              <span className="font-bold text-slate-500 font-mono">
                {CURRENCY_SYMBOLS[currency]}
              </span>
            }
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsOverallModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSavingOverall}
            >
              Update Target
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Budget Confirmation Modal */}
      {deletingBudget && (
        <Modal
          isOpen={Boolean(deletingBudget)}
          onClose={() => setDeletingBudget(null)}
          title="Delete Category Budget"
          description="Are you sure you want to remove this category spending limit?"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Removing this budget will not delete any transactions, but you will no longer receive spending threshold warnings for this category in {formatMonthDisplay(selectedMonth)}.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingBudget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={() => handleDeleteBudget(deletingBudget.id)}
              >
                Delete Budget
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
