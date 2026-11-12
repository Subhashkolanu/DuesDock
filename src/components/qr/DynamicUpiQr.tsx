import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateUpiUrl, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Copy, Check, ExternalLink, ShieldCheck, Smartphone } from 'lucide-react';

export interface DynamicUpiQrProps {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  payerName?: string;
}

export const DynamicUpiQr: React.FC<DynamicUpiQrProps> = ({
  upiId,
  payeeName,
  amount,
  transactionNote,
}) => {
  const [copied, setCopied] = useState(false);

  const upiUrl = generateUpiUrl({
    vpa: upiId,
    payeeName,
    amount,
    transactionNote,
  });

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center bg-emerald-50/40 border border-emerald-100 rounded-2xl p-6 text-center">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full mb-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        Official Club Payment Gateway
      </div>

      <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">
        {formatCurrency(amount)}
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Paying to <span className="font-semibold text-slate-700">{payeeName}</span>
      </p>

      {/* QR Code Container */}
      <div className="p-3 bg-white rounded-xl shadow-card border border-emerald-100 mb-4">
        <QRCodeSVG
          value={upiUrl}
          size={180}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: '/favicon.svg',
            x: undefined,
            y: undefined,
            height: 24,
            width: 24,
            excavate: true,
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-4 bg-white/90 border border-slate-200 rounded-lg px-3 py-1.5 w-full max-w-xs">
        <span className="truncate text-slate-700 font-mono font-medium">{upiId}</span>
        <button
          onClick={handleCopyUpi}
          type="button"
          className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 text-xs ml-auto shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Mobile UPI Direct Open */}
      <div className="w-full max-w-xs space-y-2">
        <a
          href={upiUrl}
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-emerald transition-all"
        >
          <Smartphone className="w-4 h-4" />
          Pay via GPay / PhonePe / Paytm
        </a>
        <p className="text-[11px] text-slate-400">
          After paying, submit the 12-digit UTR/Reference ID and screenshot below.
        </p>
      </div>
    </div>
  );
};
