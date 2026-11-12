# DuesDock — Collaborative Payment Tracking System

> **Designed for College Clubs, Technical Societies, and Student Event Organizers.**  
> Target Deadline: November 14, 2026.  
> Design Identity: **Modern Emerald** (Primary: `#059669`, Background: `#F8FAFC`, Font: `Inter`).

---

## Overview

College club treasurers and event leads struggle with tracking who has paid, who owes dues, verifying bank settlement UTR numbers, tracking cash/UPI collections, and managing event expenses with transparency.

**DuesDock** solves this with:
- **Dynamic UPI QR Code Generation**: Generates standard UPI QR codes (`upi://pay?pa=...`) dynamically for any dues campaign with direct "Open UPI App" mobile intent.
- **Payer Proof Submission Flow**: Members input their Roll Number/Student ID, 12-digit UPI UTR number, and upload screenshots.
- **Treasurer Verification Queue**: Split-view queue allowing treasurers to inspect proof screenshots, verify against bank statements, and 1-click Approve (with celebratory confetti) or Reject with notes.
- **Public Student Payment Portal**: Shareable direct link for event attendees to scan, pay, and submit proof without requiring a full account.
- **Roster Management with CSV Bulk-Import**: Import student roll numbers via PapaParse with 1-click.
- **1-Click Audit CSV Ledger Export**: Export the entire dues ledger into a spreadsheet ready for college faculty advisors.
- **Treasury Cash Flow & Expense Ledger**: Real-time net treasury balance (`Verified Dues Collected - Society Disbursements`).

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + `@tailwindcss/vite`
- **Data & Server State**: `@tanstack/react-query` + `zustand`
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security)
- **Icons & Micro-interactions**: `lucide-react`, `canvas-confetti`
- **Utilities**: `qrcode.react`, `papaparse`, `date-fns`, `clsx`, `tailwind-merge`

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update with your Supabase credentials (optional for demo/local mode):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## Supabase Database Setup

When you are ready to connect to a live Supabase project:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Paste the contents of `supabase/schema.sql` and click **Run**.
4. In **Storage**, create a bucket named `payment-proofs` with authenticated read/write access.
5. Copy your Project URL and Anon Public Key from **Project Settings > API** into your `.env` file.

---

## Development Sprint Milestones (Nov 12 – Nov 14, 2026)

- [x] **Milestone 1 (Scaffolding & Design Identity)**: Vite + React 19 + TS + Tailwind Modern Emerald setup, base primitives, app shell, and Supabase SQL schema.
- [x] **Milestone 2 (Club & Campaign Engine)**: Dues campaign creator, progress tracker, and target allocations.
- [x] **Milestone 3 (Dynamic UPI QR & Verification Queue)**: Realtime UPI QR generator, UTR submission, proof inspector, and 1-click verification.
- [x] **Milestone 4 (Ledger, Expenses & CSV Tools)**: 1-Click CSV export, CSV student roster bulk import, and net treasury balance tracker.
- [ ] **Milestone 5 (Final Polish & Cloud Deployment)**: Production deployment to Vercel/Netlify.
