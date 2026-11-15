# DuesDock — Personal Finance & Payment Tracking Platform

[![Production Deployment](https://img.shields.io/badge/Production-Live-00C78A?style=flat&logo=vercel&logoColor=white)](https://duesdock.vercel.app)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Tests](https://img.shields.io/badge/Tests-27%2F27_Passing-008F62?style=flat&logo=checkmarx&logoColor=white)](scripts/verify-all.mjs)

> **Track Every Expense. Understand Every Rupee.**  
> A high-performance personal wealth management platform and payment tracking system built with React 19, TypeScript, Supabase PostgreSQL with airtight Row-Level Security, and a Liquid Glass design system.

---

## Live Application

- **Production URL:** [https://duesdock.vercel.app](https://duesdock.vercel.app)
- **Repository:** [https://github.com/Subhashkolanu/DuesDock](https://github.com/Subhashkolanu/DuesDock)
- **Active Branch:** `duesdock_initial_setup_plan`

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Design Identity — Liquid Glass](#design-identity--liquid-glass)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Environment Variables](#environment-variables)
- [Supabase Configuration & Database Migrations](#supabase-configuration--database-migrations)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Engineering Team](#engineering-team)
- [License](#license)

---

## Overview

Managing personal cash flows, multi-category budgets, recurring obligations, and counterparty dues often results in fragmented notes, spreadsheet clutter, and lost receipts.

**DuesDock** is an engineer-led personal finance command center designed to give you complete visibility into your financial health. Built from the ground up on strict PostgreSQL Row-Level Security (RLS), it enforces complete cryptographic data isolation per authenticated user, guarantees zero mock financial values, and provides high-density analytics in a responsive, glassmorphic interface.

---

## Key Features

### 1. Financial Overview & Executive Dashboard
- **Real-Time KPI Metrics:** Monitor total inflow (income), total outflow (expenses), and net savings cushion with instant visual surplus/deficit indicators.
- **Payables & Receivables Summary:** Track outstanding debts and incoming receivables side-by-side.
- **Recent Activity Ledger:** Immediate visibility into your latest deposits, payments, and receipt attachments.
- **Spending Velocity Charts:** 6-month comparative cash flow bar charts and category distribution donut visualizations.
- **Budget Tracking:** Live utilization progress bars with automated visual warning thresholds.

### 2. Transaction Management & Digital Receipt Storage
- **Double-Entry Personal Ledgers:** Record and categorize every deposit and expenditure.
- **Encrypted Receipt Attachments:** Upload image receipts (JPG, PNG, PDF < 5MB) directly to a private Supabase Storage bucket, viewable through secure time-limited signed URLs.
- **Filtering & Audit Tools:** Filter by transaction type (income/expense), category, date ranges (this month, last month, last 30 days, current year), or full-text search across merchants and notes.
- **Custom Categories:** Inline creation of personalized income and expense categories in addition to system defaults.

### 3. Payment Obligations & Dues Engine
- **Directional Debt Tracking:** Clear distinction between *Payable* (money you owe) and *Receivable* (money owed to you).
- **Flexible Installments:** Record partial settlements and installments with automated balance calculations and overpayment prevention.
- **Lifecycle Status Computation:** Dynamic calculation of status (`pending`, `partially_paid`, `paid`, `overdue`, `cancelled`) based on due dates and recorded payment progress.
- **Zero Double-Counting:** Obligations maintain an isolated lifecycle that does not corrupt verified cash transaction ledgers.

### 4. Budgets & Spending Limits
- **Monthly Spending Ceiling:** Define an overarching monthly expenditure limit to benchmark total outflows.
- **Category-Specific Limits:** Assign dedicated limits to individual categories (e.g., Groceries, Housing, Dining, Entertainment).
- **Automated Threshold Warnings:** Visual alert states trigger at **80% utilization** (warning) and **100% utilization** (exceeded).
- **Calendar Month Navigation:** Seamlessly jump across previous months to review historical budget discipline.

### 5. Analytics & Visual Insights
- **Cash Flow Trends:** Interactive Recharts bar visualization comparing monthly income vs. expenses over the preceding 6 months.
- **Category Expense Breakdown:** Donut chart illustrating percentage distribution across all spending categories.
- **Top Payees & Merchants:** Algorithmic ranking of payees receiving the highest transaction volume.
- **Settlement Velocity:** Key ratios tracking overall obligation clearance rate and active debt counts.

### 6. Statements & Data Export
- **Printable Financial Statements:** Clean, executive-formatted personal financial reports optimized for browser printing and PDF export.
- **Audit-Ready CSV Exports:** 1-click export of your complete itemized transaction ledger or payment obligations table via PapaParse.

### 7. Google OAuth & Account Isolation
- **Google OAuth 2.0:** Secure login via Supabase Auth with PKCE and dynamic multi-environment redirect resolution (development, preview, and production).
- **Zero Local Passwords:** Strict OAuth delegation ensures no credentials or secrets are handled on client devices.
- **Airtight PostgreSQL RLS:** Every database query is cryptographically filtered by `auth.uid() = user_id`.

---

## Design Identity — Liquid Glass

DuesDock implements a custom **Liquid Glass / Glassmorphism** design language:

- **Translucent Surfaces:** Controlled backdrop blur (`backdrop-filter: blur(16px)`) with specular top-edge refraction borders.
- **Ambient Lighting Mesh:** Subtle background gradient orbs (emerald `#008F62` and cyan `#0284C7`) that softly refract through UI cards.
- **Refined Typography & Monospace Numerics:** Clear tabular font hierarchies with monospace figures for currency precision.
- **Dual-D Liquid Flow Emblem:** Custom geometric brand logo symbolizing financial flow and balance settlement.
- **Persistent Dual Themes:** High-contrast Dark theme (deep navy `#0B0F15` and vibrant emerald `#00C78A`) and Light theme (cool frosted slate `#F8FAFC`). Theme choices persist in `localStorage`.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19.3](https://react.dev/) + [TypeScript 7.0](https://www.typescriptlang.org/) |
| **Build Bundler** | [Vite 8.3](https://vitejs.dev/) with `@vitejs/plugin-react` |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite` |
| **Backend & Auth** | [Supabase](https://supabase.com/) (`@supabase/supabase-js` v2.119) with Google OAuth 2.0 |
| **Database** | PostgreSQL with Row-Level Security (RLS) & B-Tree indexes |
| **Storage** | Encrypted Supabase Storage bucket (`receipts`) |
| **State Management** | [Zustand 5.1](https://zustand-demo.pmnd.rs/) & [TanStack Query v5](https://tanstack.com/query) |
| **Data Visualization** | [Recharts 3.10](https://recharts.org/) |
| **Icons & UI** | [Lucide React](https://lucide.dev/), [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Data Parsing & Dates** | [PapaParse 5.7](https://www.papaparse.com/), [date-fns 4.4](https://date-fns.org/) |
| **Code Quality** | [Oxlint 1.90](https://oxc.rs/docs/guide/usage/linter.html), Automated Custom Test Suite |

---

## Project Structure

```text
DuesDock/
├── public/
│   ├── assets/
│   │   └── team/              # Verified team member photographs
│   ├── favicon.svg            # Liquid Glass dual-D vector favicon
│   └── robots.txt
├── scripts/
│   └── verify-all.mjs         # 27-test automated regression & verification suite
├── src/
│   ├── assets/                # Static brand SVGs and vector artwork
│   ├── components/
│   │   ├── common/            # Logo, StatCard, ThemeToggle, NotificationBell
│   │   ├── layout/            # Navbar, App Shell, Footer
│   │   └── ui/                # Liquid Glass primitives: Button, Card, Input, Modal, Badge
│   ├── context/
│   │   └── ThemeContext.tsx   # Dark/Light theme provider and persistent state
│   ├── features/
│   │   ├── analytics/         # AnalyticsManager, comparative charts, payee breakdowns
│   │   ├── auth/              # AuthContext, Google OAuth, LoginPage
│   │   ├── budgets/           # BudgetManager, category limits, threshold alerts
│   │   ├── dashboard/         # FinanceDashboard, KPI metrics, recent activity
│   │   ├── developers/        # DevelopersPage, team roster, architecture summary
│   │   ├── onboarding/        # OnboardingWizard, currency selection, base budget
│   │   ├── payments/          # PaymentManager, obligations, installments, modal dialogs
│   │   ├── reports/           # ReportsManager, printable statements, CSV export
│   │   ├── settings/          # SettingsManager, profile preferences, security audit
│   │   └── transactions/      # TransactionManager, ledgers, modal forms, receipt upload
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client, storage upload, dynamic OAuth redirects
│   │   └── utils.ts           # Financial formatting, calendar utilities, event dispatchers
│   ├── services/
│   │   ├── budgetService.ts   # Category and global budget targets Supabase RPCs
│   │   ├── paymentService.ts  # Obligations and installment tracking engine
│   │   └── transactionService.ts # Income and expense ledger CRUD operations
│   ├── types/
│   │   └── database.types.ts  # Database models, enum types, TypeScript interfaces
│   ├── App.tsx                # Route switcher, auth gatekeeper, layout shell
│   ├── index.css              # Liquid Glass design tokens, ambient lighting, keyframes
│   └── main.tsx               # Application bootstrap and root DOM mounting
├── supabase/
│   ├── migrations/
│   │   ├── 20261112000001_personal_finance_schema.sql # Profiles, categories, transactions, budgets, RLS
│   │   └── 20261114000001_payments_system.sql        # Payments, installments, triggers, RLS
│   └── schema.sql             # Consolidated base schema
├── package.json               # Dependencies, scripts, and build configuration
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts             # Vite bundler configuration with Tailwind CSS v4
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- A free [Supabase](https://supabase.com/) account for database and authentication services.

### Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Subhashkolanu/DuesDock.git
   cd DuesDock
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to create your local `.env`:
   ```bash
   cp .env.example .env
   ```

---

## Environment Variables

Edit `.env` with your project configuration. **Only use standard client-safe publishable keys.** Never put service-role keys or private credentials in this file:

```env
# Supabase Project Settings (found in Supabase Dashboard > Project Settings > API)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key-here

# Application Settings
VITE_APP_NAME="DuesDock"
VITE_DEFAULT_CURRENCY="INR"
```

---

## Supabase Configuration & Database Migrations

DuesDock uses additive PostgreSQL migrations to configure tables, triggers, and Row-Level Security policies.

### 1. Apply Database Migrations

You can apply the migrations using either the Supabase CLI or the Supabase SQL Editor:

#### Option A: Using the Supabase SQL Editor
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to your project, open the **SQL Editor**, and create a **New Query**.
3. Sequentially run the contents of each migration file:
   - First: `supabase/migrations/20261112000001_personal_finance_schema.sql` (Creates `profiles`, `categories`, `transactions`, `budgets`, storage buckets, and RLS policies).
   - Second: `supabase/migrations/20261114000001_payments_system.sql` (Creates `payments`, `payment_installments`, payment trigger functions, and RLS policies).

#### Option B: Using the Supabase CLI
```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 2. Configure Google OAuth in Supabase

1. In Supabase Dashboard, navigate to **Authentication** → **Providers** → **Google**.
2. Enable Google authentication and input your Google OAuth **Client ID** and **Client Secret** (from the [Google Cloud Console](https://console.cloud.google.com/)).
3. In **Authentication** → **URL Configuration**:
   - Set **Site URL** to your production domain: `https://duesdock.vercel.app`
   - Add the following to **Redirect URLs**:
     ```text
     https://duesdock.vercel.app/**
     http://localhost:5173/**
     http://localhost:4173/**
     ```

### 3. Verify Storage Bucket

The migrations automatically configure the `receipts` storage bucket with private row-level access. Receipts can only be uploaded and accessed by the authenticated user who created them via signed URLs.

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the local Vite development server at `http://localhost:5173` |
| `npm test` | Runs the 27-test automated verification suite (`scripts/verify-all.mjs`) |
| `npm run lint` | Runs the high-performance Oxlint code quality auditor |
| `npm run build` | Compiles TypeScript types and builds production assets into `dist/` |
| `npm run preview` | Locally serves the production build at `http://localhost:4173` |

### Automated Verification Suite

Run all functional, financial calculation, and identity tests with:

```bash
npm test
```

The test runner validates:
1. **Date & Timezone Utilities:** Month key generation across year boundaries and UTC offset resilience.
2. **Financial Calculations:** Total inflow, outflow, net cash flow, savings rate formulas, and budget deductions.
3. **Analytics Engine:** Subtitle resolver fallback hierarchy and zero-state accuracy.
4. **Payment Obligations:** State computation (`pending`, `partially_paid`, `paid`, `overdue`), installment limits, and net balances.
5. **Developers & Identity:** Correct developer ordering, verified photograph paths, initials fallbacks, and personal profile links.

---

## Deployment

DuesDock is deployed on [Vercel](https://vercel.com/) with automated continuous deployment connected to the `duesdock_initial_setup_plan` branch.

### Manual Vercel Deployment Steps

1. Push your changes to GitHub:
   ```bash
   git push origin duesdock_initial_setup_plan
   ```
2. In the Vercel Dashboard, import the repository and configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Production Environment Variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy and verify at [https://duesdock.vercel.app](https://duesdock.vercel.app).

---

## Engineering Team

DuesDock is engineered by:

| # | Name | Role | Links |
| :-: | :--- | :--- | :--- |
| **1** | **Sai Subhash Kolanu** | Lead Developer | [GitHub](https://github.com/Subhashkolanu) • [LinkedIn](https://www.linkedin.com/in/sai-subhash-kolanu-358ba0376/) • [Email](mailto:saisubhash.kolanu@gmail.com) |
| **2** | **Kolisetty Madhavi Venkata Durga** | Software Engineer | [GitHub](https://github.com/madhavikolisetty717) |
| **3** | **Katta Lakshmi Lahari** | Software Engineer | *GitHub pending* |
| **4** | **Katragadda Anjali Durga** | Software Engineer | [GitHub](https://github.com/anjalidurgakatragadda-glitch) |
| **5** | **Katla Venu** | Software Engineer | [GitHub](https://github.com/katlakishore86-oss) |

---

## License

This project is licensed under the [MIT License](LICENSE).
