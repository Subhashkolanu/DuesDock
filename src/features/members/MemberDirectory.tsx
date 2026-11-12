import React, { useState } from 'react';
import { useClubStore } from '@/stores/useClubStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  Upload,
  UserPlus,
  Search,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Papa from 'papaparse';

export const MemberDirectory: React.FC = () => {
  const duesRecords = useClubStore((s) => s.duesRecords);
  const campaigns = useClubStore((s) => s.campaigns);
  const importMembers = useClubStore((s) => s.importMembers);

  const [search, setSearch] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [targetCampaignId, setTargetCampaignId] = useState(campaigns[0]?.id || '');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Group dues records by unique member/studentId
  const memberMap = new Map<string, {
    name: string;
    studentId: string;
    email: string;
    records: typeof duesRecords;
  }>();

  duesRecords.forEach((r) => {
    const key = r.payer_student_id || r.payer_name;
    if (!memberMap.has(key)) {
      memberMap.set(key, {
        name: r.payer_name,
        studentId: r.payer_student_id || 'N/A',
        email: r.payer_email || 'N/A',
        records: [],
      });
    }
    memberMap.get(key)!.records.push(r);
  });

  const members = Array.from(memberMap.values()).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const handleCsvImport = () => {
    if (!csvText.trim()) return;

    try {
      const parsed = Papa.parse(csvText.trim(), {
        header: true,
        skipEmptyLines: true,
      });

      const campaign = campaigns.find((c) => c.id === targetCampaignId) || campaigns[0];
      const defaultAmount = campaign ? campaign.target_amount_per_person : 500;

      const membersToImport = parsed.data.map((row: any) => ({
        name: row['Name'] || row['name'] || row['Full Name'] || 'Student Member',
        studentId: row['Roll No'] || row['student_id'] || row['Roll'] || row['ID'] || '2024CSB' + Math.floor(1000 + Math.random() * 9000),
        email: row['Email'] || row['email'] || '',
        campaignId: targetCampaignId,
        amount: defaultAmount,
      }));

      importMembers(membersToImport);
      setImportStatus(`Successfully imported ${membersToImport.length} members!`);
      setTimeout(() => {
        setIsImportModalOpen(false);
        setCsvText('');
        setImportStatus(null);
      }, 1500);
    } catch (err) {
      setImportStatus('Error parsing CSV. Please check formatting.');
    }
  };

  const sampleCsv = `Name,Roll No,Email\nRahul Varma,2024CSB1044,rahul@college.edu\nAnanya Sen,2024ECE1088,ananya@college.edu\nHarsh Patel,2023MECH1012,harsh@college.edu`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Society Members & Rosters
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of enrolled student members and their dues payment statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import Roster CSV
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <Input
          placeholder="Search by student name or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftElement={<Search className="w-4 h-4" />}
        />
      </Card>

      {/* Members Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Campaign Records</th>
                <th className="py-3 px-4 text-right">Latest Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No members found. Use "Import Roster CSV" to add student rolls.
                  </td>
                </tr>
              ) : (
                members.map((member, i) => {
                  const latestRecord = member.records[0];
                  return (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {member.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {member.studentId}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{member.email}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {member.records.length} campaign(s) assigned
                      </td>
                      <td className="py-3 px-4 text-right">
                        {latestRecord && (
                          <StatusBadge status={latestRecord.status} />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Batch Import Student Roster (CSV)"
        description="Paste student roll numbers to automatically assign campaign dues."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Campaign to Assign
            </label>
            <select
              value={targetCampaignId}
              onChange={(e) => setTargetCampaignId(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} (₹{c.target_amount_per_person})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Paste CSV Data (with Headers: Name, Roll No, Email)
              </label>
              <button
                type="button"
                onClick={() => setCsvText(sampleCsv)}
                className="text-[11px] text-emerald-600 hover:underline font-semibold"
              >
                Load Sample CSV
              </button>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={sampleCsv}
              className="w-full rounded-lg border border-slate-300 p-2.5 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
              {importStatus}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCsvImport}
              disabled={!csvText.trim()}
            >
              Import Members
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
