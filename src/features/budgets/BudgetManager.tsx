import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { budgetService } from '@/services/budgetService';
import { transactionService } from '@/services/transactionService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BudgetStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, CURRENCY_SYMBOLS, getCurrentMonthKey, TRANSACTION_UPDATED_EVENT } from '@/lib/utils';
import type { Budget, Category, Transaction, CurrencyCode } from '@/types/database.types';
import {
  PieChart,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
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

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(TRANSACTION_UPDATED_EVENT, handleUpdate);
    window.addEventListener('duesdock_transaction_saved', handleUpdate);
    return () => {
      window.removeEventListener(TRANSACTION_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('duesdock_transaction_saved', handleUpdate);
    };
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
          <h1 className="font-heading font-bold text-2xl text-[#17212B] dark:text-[#F5F7FA] tracking-tight">
            Budgets & Spending Limits
          </h1>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
            Configure monthly category limits, prevent overruns, and monitor savings
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#F1F4F6] dark:bg-[#202830] rounded-xl border border-[#E5E9EF] dark:border-[#303943]">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA] hover:bg-[#FFFFFF] dark:hover:bg-[#171D23] transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-medium text-xs text-[#17212B] dark:text-[#F5F7FA] px-3 min-w-[140px] text-center">
            {formatMonthDisplay(selectedMonth)}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA] hover:bg-[#FFFFFF] dark:hover:bg-[#171D23] transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#DC5252]/10 border border-[#DC5252]/20 rounded-xl text-xs text-[#DC5252] dark:text-[#FF6666] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Notice</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 1. OVERALL MONTHLY BUDGET CARD */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E9EF] dark:border-[#303943]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#008F62] dark:text-[#00C78A] bg-[#008F62]/10 dark:bg-[#00C78A]/15 px-2.5 py-0.5 rounded-full">
                Overall Spending Ceiling
              </span>
              <BudgetStatusBadge percentage={overallPercentUsed} />
            </div>
            <h2 className="font-heading font-semibold text-lg text-[#17212B] dark:text-[#F5F7FA] tracking-tight mt-2">
              {formatMonthDisplay(selectedMonth)} Overall Target
            </h2>
            <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
              Across all categories: {formatCurrency(totalSpentInMonth, currency)} spent of{' '}
              {formatCurrency(overallTarget, currency)} ceiling
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
            Edit Target
          </Button>
        </div>

        {/* Progress Bar & Warning State */}
        <div className="pt-4 space-y-3">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-[#667085] dark:text-[#9AA6B2]">
              Utilization: {Math.round(overallPercentUsed)}%
            </span>
            <span
              className={`font-mono font-semibold ${
                overallRemaining >= 0
                  ? 'text-[#008F62] dark:text-[#00C78A]'
                  : 'text-[#DC5252] dark:text-[#FF6666]'
              }`}
            >
              {overallRemaining >= 0
                ? `${formatCurrency(overallRemaining, currency)} remaining`
                : `Over budget by ${formatCurrency(Math.abs(overallRemaining), currency)}`}
            </span>
          </div>

          {/* Subtle Progress Bar */}
          <div className="w-full bg-[#F1F4F6] dark:bg-[#202830] rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                overallPercentUsed >= 100
                  ? 'bg-[#DC5252] dark:bg-[#FF6666]'
                  : overallPercentUsed >= 80
                  ? 'bg-[#D99A27] dark:bg-[#F0B94B]'
                  : 'bg-[#008F62] dark:bg-[#00C78A]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, overallPercentUsed))}%` }}
            />
          </div>

          {overallPercentUsed >= 100 ? (
            <div className="p-3 rounded-xl border border-[#DC5252]/20 bg-[#DC5252]/10 text-xs text-[#DC5252] dark:text-[#FF6666] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Budget exceeded: Outflows have exceeded your planned monthly ceiling.</span>
            </div>
          ) : overallPercentUsed >= 80 ? (
            <div className="p-3 rounded-xl border border-[#D99A27]/20 bg-[#D99A27]/10 text-xs text-[#D99A27] dark:text-[#F0B94B] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Warning: Over 80% of your designated monthly budget has been consumed.</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-[#008F62]/20 bg-[#008F62]/10 text-xs text-[#008F62] dark:text-[#00C78A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>On track: Spending is healthy and well within your planned ceiling.</span>
            </div>
          )}
        </div>
      </Card>

      {/* 2. CATEGORY BUDGETS HEADER & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div>
          <h2 className="font-heading font-semibold text-lg text-[#17212B] dark:text-[#F5F7FA] flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#008F62] dark:text-[#00C78A]" />
            Category-Specific Budgets
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] mt-0.5">
            Individual spending limits per category for {formatMonthDisplay(selectedMonth)}
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
        <div className="p-12 text-center text-xs text-[#667085] dark:text-[#9AA6B2] flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#008F62] dark:text-[#00C78A]" />
          <span>Loading category budgets...</span>
        </div>
      ) : budgets.length === 0 ? (
        <Card className="p-10 text-center space-y-3 border border-dashed border-[#E5E9EF] dark:border-[#303943]">
          <div className="w-12 h-12 rounded-2xl bg-[#008F62]/10 dark:bg-[#00C78A]/15 text-[#008F62] dark:text-[#00C78A] flex items-center justify-center mx-auto">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-semibold text-base text-[#17212B] dark:text-[#F5F7FA]">
            No Category Budgets for {formatMonthDisplay(selectedMonth)}
          </h3>
          <p className="text-xs text-[#667085] dark:text-[#9AA6B2] max-w-sm mx-auto">
            Set dedicated limits for Groceries, Dining, Rent, or Entertainment to track specific expenditure caps.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewBudget}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Category Budget
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const category = categories.find((c) => c.id === b.category_id);
            const catName = category?.name || 'Uncategorized';
            const catColor = category?.color || '#008F62';

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
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <h3 className="font-semibold text-sm text-[#17212B] dark:text-[#F5F7FA] truncate">
                        {catName}
                      </h3>
                    </div>
                    <BudgetStatusBadge percentage={percentUsed} />
                  </div>

                  <div className="space-y-0.5 mb-4">
                    <div className="text-2xl font-mono font-bold text-[#17212B] dark:text-[#F5F7FA]">
                      {formatCurrency(spentInCategory, currency)}
                    </div>
                    <p className="text-xs text-[#667085] dark:text-[#9AA6B2]">
                      of {formatCurrency(b.budget_limit, currency)} limit
                    </p>
                  </div>

                  {/* Subtle Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="w-full bg-[#F1F4F6] dark:bg-[#202830] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentUsed >= 100
                            ? 'bg-[#DC5252] dark:bg-[#FF6666]'
                            : percentUsed >= 80
                            ? 'bg-[#D99A27] dark:bg-[#F0B94B]'
                            : 'bg-[#008F62] dark:bg-[#00C78A]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, percentUsed))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-[#667085] dark:text-[#9AA6B2]">
                        {Math.round(percentUsed)}% used
                      </span>
                      <span
                        className={
                          remaining >= 0
                            ? 'text-[#008F62] dark:text-[#00C78A]'
                            : 'text-[#DC5252] dark:text-[#FF6666] font-semibold'
                        }
                      >
                        {remaining >= 0
                          ? `${formatCurrency(remaining, currency)} left`
                          : `Over by ${formatCurrency(Math.abs(remaining), currency)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-[#E5E9EF] dark:border-[#303943]">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 rounded-lg text-[#667085] dark:text-[#9AA6B2] hover:text-[#008F62] dark:hover:text-[#00C78A] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] transition-colors"
                    title="Edit Limit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingBudget(b)}
                    className="p-1.5 rounded-lg text-[#667085] dark:text-[#9AA6B2] hover:text-[#DC5252] dark:hover:text-[#FF6666] hover:bg-[#DC5252]/10 transition-colors"
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
            <label className="block text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] mb-1.5">
              Expense Category
            </label>
            <select
              value={modalCategoryId}
              onChange={(e) => setModalCategoryId(e.target.value)}
              disabled={Boolean(editingBudget)}
              className="w-full h-10 rounded-lg border border-[#E5E9EF] dark:border-[#303943] bg-[#FFFFFF] dark:bg-[#101418] px-3 py-2 text-xs font-medium text-[#17212B] dark:text-[#F5F7FA] focus:outline-none focus:border-[#008F62] dark:focus:border-[#00C78A] disabled:opacity-50"
              required
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {editingBudget && (
              <p className="text-[11px] text-[#667085] dark:text-[#9AA6B2] mt-1">
                Category cannot be altered during edit. Delete and re-create to change category.
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
              <span className="font-semibold text-[#667085] dark:text-[#9AA6B2] font-mono text-sm">
                {CURRENCY_SYMBOLS[currency]}
              </span>
            }
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E9EF] dark:border-[#303943]">
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
        title="Monthly Spending Target"
        description="Defines baseline target ceiling across all monthly outflows."
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
              <span className="font-semibold text-[#667085] dark:text-[#9AA6B2] font-mono text-sm">
                {CURRENCY_SYMBOLS[currency]}
              </span>
            }
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E9EF] dark:border-[#303943]">
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
            <div className="p-4 bg-[#DC5252]/10 border border-[#DC5252]/20 rounded-xl text-xs text-[#DC5252] dark:text-[#FF6666] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Removing this budget will not delete any transactions, but you will no longer receive spending threshold alerts for this category in {formatMonthDisplay(selectedMonth)}.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E9EF] dark:border-[#303943]">
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
