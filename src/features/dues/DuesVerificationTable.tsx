import React, { useState } from 'react';
import { useClubStore } from '@/stores/useClubStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  Check,
  X,
  ExternalLink,
  Eye,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import Papa from 'papaparse';
import type { Database, PaymentStatus } from '@/types/database.types';

type DuesRecord = Database['public']['Tables']['dues_records']['Row'];

export const DuesVerificationTable: React.FC = () => {
  const duesRecords = useClubStore((s) => s.duesRecords);
  const campaigns = useClubStore((s) => s.campaigns);
  const currentClub = useClubStore((s) => s.currentClub);
  const verifyRecord = useClubStore((s) => s.verifyRecord);
  const rejectRecord = useClubStore((s) => s.rejectRecord);

  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inspectRecord, setInspectRecord] = useState<DuesRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Filter records
  const filteredRecords = duesRecords.filter((record) => {
    const matchesSearch =
      record.payer_name.toLowerCase().includes(search.toLowerCase()) ||
      (record.payer_student_id &&
        record.payer_student_id.toLowerCase().includes(search.toLowerCase())) ||
      (record.utr_reference &&
        record.utr_reference.toLowerCase().includes(search.toLowerCase()));

    const matchesCampaign =
      selectedCampaign === 'all' || record.campaign_id === selectedCampaign;

    const matchesStatus =
      statusFilter === 'all' || record.status === statusFilter;

    return matchesSearch && matchesCampaign && matchesStatus;
  });

  // Export to CSV
  const handleExportCsv = () => {
    const exportData = filteredRecords.map((r) => {
      const camp = campaigns.find((c) => c.id === r.campaign_id);
      return {
        'Payer Name': r.payer_name,
        'Student ID / Roll No': r.payer_student_id || 'N/A',
        'Campaign Title': camp ? camp.title : 'General',
        'Amount Due': r.amount_due,
        'Amount Paid': r.amount_paid,
        'Status': r.status.toUpperCase(),
        'Payment Mode': r.payment_mode.toUpperCase(),
        'UTR / Transaction Ref': r.utr_reference || 'N/A',
        'Submitted At': r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : 'N/A',
        'Verified At': r.verified_at ? new Date(r.verified_at).toLocaleDateString() : 'N/A',
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${currentClub.slug}-dues-ledger-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmReject = () => {
    if (!inspectRecord) return;
    rejectRecord(
      inspectRecord.id,
      rejectionReason || 'Payment could not be verified in club bank statement.'
    );
    setIsRejecting(false);
    setInspectRecord(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dues Ledger & Verification Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit proof submissions, verify bank settlement UTRs, and track payments.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
        >
          Export CSV Ledger
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search by student name, roll number, or UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftElement={<Search className="w-4 h-4" />}
          />

          {/* Campaign Selector */}
          <div>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Proof Submitted (Needs Action)</option>
              <option value="verified">Verified / Paid</option>
              <option value="pending">Pending Payment</option>
              <option value="rejected">Rejected / Needs Recheck</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Member / Payer</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">UTR / Reference</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No payment records match your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const camp = campaigns.find((c) => c.id === record.campaign_id);
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {record.payer_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {record.payer_student_id || 'ID: Unspecified'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 max-w-[180px] truncate">
                        {camp?.title || 'General Dues'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatCurrency(record.amount_due)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {record.utr_reference ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {record.utr_reference}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {record.proof_image_url && (
                            <button
                              onClick={() => {
                                setInspectRecord(record);
                                setIsRejecting(false);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Inspect Receipt Proof"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {record.status === 'submitted' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="px-2 py-1 text-xs"
                                onClick={() => verifyRecord(record.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                className="px-2 py-1 text-xs"
                                onClick={() => {
                                  setInspectRecord(record);
                                  setIsRejecting(true);
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {record.status === 'verified' && (
                            <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Proof Inspection & Action Modal */}
      {inspectRecord && (
        <Modal
          isOpen={Boolean(inspectRecord)}
          onClose={() => {
            setInspectRecord(null);
            setIsRejecting(false);
          }}
          title={isRejecting ? 'Reject Payment Submission' : 'Payment Proof Inspection'}
          description={`Payer: ${inspectRecord.payer_name} (${inspectRecord.payer_student_id || 'Student'})`}
          maxWidth="lg"
        >
          {isRejecting ? (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Rejecting will flag this record and notify the student with your explanation.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection / Correction Request
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR number not found in club SBI statement, screenshot illegible, or partial amount..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejecting(false)}
                >
                  Back
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmReject}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Amount:</span>{' '}
                  <span className="font-bold text-slate-900">
                    {formatCurrency(inspectRecord.amount_due)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">UTR / Reference:</span>{' '}
                  <span className="font-mono font-bold text-emerald-800">
                    {inspectRecord.utr_reference || 'None'}
                  </span>
                </div>
              </div>

              {inspectRecord.proof_image_url && (
                <div>
                  <span className="text-xs font-semibold text-slate-700 mb-1 block">
                    Uploaded Payment Receipt / Screenshot
                  </span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-72 bg-slate-950 flex items-center justify-center">
                    <img
                      src={inspectRecord.proof_image_url}
                      alt="Proof"
                      className="max-h-72 w-auto object-contain"
                    />
                  </div>
                </div>
              )}

              {inspectRecord.status === 'submitted' && (
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsRejecting(true)}
                  >
                    Reject with Reason
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      verifyRecord(inspectRecord.id);
                      setInspectRecord(null);
                    }}
                  >
                    Approve Payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
