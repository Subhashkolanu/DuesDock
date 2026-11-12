import React, { useState } from 'react';
import { useClubStore } from '@/stores/useClubStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DynamicUpiQr } from '@/components/qr/DynamicUpiQr';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Upload,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export interface PublicPayPortalProps {
  initialCampaignId?: string;
  onBackToDashboard?: () => void;
}

export const PublicPayPortal: React.FC<PublicPayPortalProps> = ({
  initialCampaignId,
  onBackToDashboard,
}) => {
  const currentClub = useClubStore((s) => s.currentClub);
  const campaigns = useClubStore((s) => s.campaigns);
  const submitPayment = useClubStore((s) => s.submitPayment);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    initialCampaignId || campaigns[0]?.id || ''
  );

  const [payerName, setPayerName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [utr, setUtr] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const activeCampaign =
    campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !payerName || !studentId || !utr) return;

    submitPayment({
      campaignId: activeCampaign.id,
      payerName,
      studentId,
      email,
      amount: activeCampaign.target_amount_per_person,
      utr,
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    });

    setSubmittedSuccess(true);
  };

  const handleReset = () => {
    setPayerName('');
    setStudentId('');
    setEmail('');
    setUtr('');
    setSubmittedSuccess(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-2">
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-medium mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
      )}

      {submittedSuccess ? (
        <Card className="p-8 text-center bg-white shadow-emerald border-emerald-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Submission Received
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Payment Proof Submitted!
          </h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            Your transaction reference <span className="font-mono font-bold text-slate-800">{utr}</span> has been queued for verification with the {currentClub.name} treasurer.
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2 max-w-sm mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-500">Student:</span>
              <span className="font-semibold text-slate-900">{payerName} ({studentId})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Campaign:</span>
              <span className="font-semibold text-slate-900">{activeCampaign?.title}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-emerald-700">
              <span>Amount Paid:</span>
              <span>{formatCurrency(activeCampaign?.target_amount_per_person || 0)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Submit Another Payment
            </Button>
            {onBackToDashboard && (
              <Button variant="primary" size="sm" onClick={onBackToDashboard}>
                Return to Dashboard
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full inline-flex items-center gap-1 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Official Campus Payment Portal
            </span>
            <h1 className="text-xl sm:text-2xl font-black">{currentClub.name}</h1>
            <p className="text-xs text-emerald-100/80 mt-1">
              Select campaign and complete your dues payment via UPI
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Step 1: Choose Campaign */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Select Dues Campaign
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {campaigns.map((camp) => (
                  <button
                    key={camp.id}
                    type="button"
                    onClick={() => setSelectedCampaignId(camp.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedCampaignId === camp.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {camp.title}
                    </div>
                    <div className="text-emerald-700 font-extrabold text-sm mt-1">
                      {formatCurrency(camp.target_amount_per_person)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Dynamic UPI QR Code */}
            {activeCampaign && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  2. Scan & Pay via UPI
                </label>
                <DynamicUpiQr
                  upiId={currentClub.upi_id}
                  payeeName={currentClub.upi_payee_name}
                  amount={activeCampaign.target_amount_per_person}
                  transactionNote={`${activeCampaign.title.slice(0, 25)} - DuesDock`}
                />
              </div>
            )}

            {/* Step 3: Verification Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  3. Enter Student Details & 12-Digit UTR
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Required for Verification
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Your Full Name"
                  placeholder="e.g. Rahul Sharma"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  required
                />
                <Input
                  label="College Roll No / Student ID"
                  placeholder="e.g. 2024CSB1042"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="College Email (Optional for receipt)"
                  type="email"
                  placeholder="rahul@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="12-Digit UPI UTR / Transaction ID"
                  placeholder="e.g. 431809241902"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  required
                  helperText="Found in Google Pay / PhonePe / Paytm transaction receipt"
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                className="w-full font-bold shadow-emerald"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Submit Payment for Verification
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
