import React, { useState } from 'react';
import { useClubStore } from '@/stores/useClubStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import {
  Receipt,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Tag,
  Calendar,
  Wallet,
} from 'lucide-react';

export const ExpenseTracker: React.FC = () => {
  const expenses = useClubStore((s) => s.expenses);
  const duesRecords = useClubStore((s) => s.duesRecords);
  const addExpense = useClubStore((s) => s.addExpense);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Hardware & Kits');

  const totalVerifiedCollections = duesRecords
    .filter((r) => r.status === 'verified')
    .reduce((sum, r) => sum + r.amount_paid, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalVerifiedCollections - totalExpenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    addExpense({
      campaign_id: null,
      title,
      amount: parseFloat(amount),
      category,
      receipt_url: null,
      expense_date: new Date().toISOString(),
    });

    setTitle('');
    setAmount('');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Treasury Ledger & Disbursements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent record of club expenditures deducted against member dues collections.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Log Expense
        </Button>
      </div>

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>Verified Inflows</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">
            {formatCurrency(totalVerifiedCollections)}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">From approved student dues</p>
        </Card>

        <Card className="p-5 border-rose-200 bg-rose-50/40">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
            <span>Logged Disbursements</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-2">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-[11px] text-rose-700 mt-1">Approved society purchases</p>
        </Card>

        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Current Treasury Health</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(netBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Available in society account</p>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disbursement Ledger</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Item / Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No expenses logged yet.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {expense.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-700 font-medium text-[11px]">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(expense.expense_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      - {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Log Society Expense"
        description="Record a disbursement made from the club treasury."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Expense Description"
            placeholder="e.g. 3D Printer Filament Spools or Food for Hackathon"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (₹)"
              type="number"
              min="1"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Hardware & Kits">Hardware & Kits</option>
                <option value="Printing & Stationery">Printing & Stationery</option>
                <option value="Refreshments & Food">Refreshments & Food</option>
                <option value="Event Venue & Audio">Event Venue & Audio</option>
                <option value="Prizes & Medals">Prizes & Medals</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Log Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
