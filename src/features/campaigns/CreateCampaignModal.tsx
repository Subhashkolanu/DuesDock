import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useClubStore } from '@/stores/useClubStore';

export interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
}) => {
  const createCampaign = useClubStore((s) => s.createCampaign);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount || !dueDate) return;

    createCampaign({
      title,
      description: description || null,
      target_amount_per_person: parseFloat(targetAmount),
      due_date: new Date(dueDate).toISOString(),
      allow_custom_amount: false,
      status: 'active',
    });

    setTitle('');
    setDescription('');
    setTargetAmount('');
    setDueDate('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Dues Campaign"
      description="Launch a collection drive for membership dues, event tickets, or kit fees."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Campaign Title"
          placeholder="e.g. Annual Membership 2026-27 or AI Hackathon Kit"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description & Instructions
          </label>
          <textarea
            rows={3}
            placeholder="What does this fee cover? Any instructions for members?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount per Member (₹)"
            type="number"
            min="1"
            placeholder="e.g. 500"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />

          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Create Campaign
          </Button>
        </div>
      </form>
    </Modal>
  );
};
