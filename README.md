# DuesDock — Personal Finance & Payment Tracking

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployment-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<p align="center">
  <strong>Track Every Expense. Understand Every Rupee.</strong>
  <br />
  A modern personal finance and payment tracking platform.
</p>

<p align="center">
  <a href="https://duesdock.vercel.app/">
    <img src="https://img.shields.io/badge/LIVE_DEMO-Visit_DuesDock-00C78A?style=for-the-badge" />
  </a>
  <a href="https://github.com/Subhashkolanu/DuesDock">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" />
  </a>
</p>

---

## Overview

DuesDock is a personal finance and payment tracking application designed to simplify how people manage their money.

It brings income, expenses, budgets, payables, receivables, analytics, and financial reports together in one centralized platform.

Built using React, TypeScript, Supabase, and PostgreSQL, DuesDock combines practical financial tools with a responsive Liquid Glass interface.

## Application Preview

### Dashboard

![DuesDock Dashboard](screenshots/dashboard.png)

### Transaction Management

![DuesDock Transactions](screenshots/transactions.png)

### Payment Tracking

![DuesDock Payments](screenshots/payments.png)

### Analytics

![DuesDock Analytics](screenshots/analytics.png)

### Budget Management

![DuesDock Budgets](screenshots/budgets.png)

## Key Features

### 1. Financial Dashboard

- Monitor total income, expenses, and net cash flow.
- View outstanding payables and receivables.
- Track recent financial activity.
- Explore monthly cash flow and spending charts.
- Monitor budget utilization.

### 2. Transaction Management

- Record income and expenses.
- Organize transactions by categories.
- Add merchant details, dates, payment methods, and notes.
- Filter transactions by type, category, and date.
- Upload and manage receipt attachments.

### 3. Payment Tracking

- Track Payables — money you owe.
- Track Receivables — money owed to you.
- Record partial payments and installments.
- Automatically calculate remaining balances.
- Monitor payment statuses: Pending, Partially Paid, Paid, Overdue, and Cancelled.

### 4. Budget Management

- Set monthly spending limits.
- Create category-specific budgets.
- Monitor budget utilization.
- View spending threshold indicators.
- Navigate between monthly budgets.

### 5. Analytics & Insights

- Monthly income versus expense comparisons.
- Category-wise spending breakdown.
- Top payees and merchants.
- Payment settlement insights.

### 6. Reports & Exports

- Generate printable financial statements.
- Export transaction records as CSV.
- Export payment records as CSV.

### 7. Authentication & Security

- Google sign-in through Supabase Authentication.
- PostgreSQL Row-Level Security (RLS).
- User-scoped database access.
- Private Supabase Storage bucket for receipts.

## Design Identity — Liquid Glass

DuesDock uses a custom Liquid Glass design system.

- Translucent glass-style surfaces.
- Ambient gradient backgrounds.
- Responsive layouts.
- Dark and light themes.
- Consistent typography and financial data formatting.
- Custom DuesDock branding and logo.

## Technology Stack

| Layer                    | Technologies            |
| ------------------------ | ----------------------- |
| Frontend                 | React, TypeScript       |
| Build Tool               | Vite                    |
| Styling                  | Tailwind CSS v4         |
| Backend & Authentication | Supabase                |
| Database                 | PostgreSQL              |
| File Storage             | Supabase Storage        |
| State Management         | Zustand, TanStack Query |
| Data Visualization       | Recharts                |
| Icons                    | Lucide React            |
| CSV Processing           | PapaParse               |
| Date Utilities           | date-fns                |
| Code Quality             | Oxlint                  |

## Project Structure

```text
DuesDock/
├── public/
│   └── assets/
│       └── team/
├── scripts/
│   └── verify-all.mjs
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── ui/
│   ├── context/
│   ├── features/
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── budgets/
│   │   ├── dashboard/
│   │   ├── developers/
│   │   ├── onboarding/
│   │   ├── payments/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── transactions/
│   ├── lib/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   └── schema.sql
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (20 or later recommended)
- npm
- Supabase account
- Google Cloud project for Google OAuth

### 1. Clone the Repository

```bash
git clone https://github.com/Subhashkolanu/DuesDock.git
cd DuesDock
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root using `.env.example` as a reference.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key

VITE_APP_NAME=DuesDock
VITE_DEFAULT_CURRENCY=INR
```

**Important:** Use only client-safe Supabase publishable/anon keys. Never expose service-role keys or private credentials in frontend environment variables.

### 4. Configure Supabase Database

Apply the SQL migrations in the following order using the Supabase SQL Editor:

1. `supabase/migrations/20261112000001_personal_finance_schema.sql`
2. `supabase/migrations/20261114000001_payments_system.sql`

These migrations configure the database tables, payment tracking system, and associated access policies.

### 5. Configure Google Authentication

In your Supabase Dashboard:

1. Open Authentication → Providers → Google.
2. Enable Google authentication.
3. Configure your Google OAuth Client ID and Client Secret.
4. Open Authentication → URL Configuration.
5. Set the production Site URL:

```text
https://duesdock.vercel.app
```

Add these redirect URLs:

```text
https://duesdock.vercel.app/**
http://localhost:5173/**
http://localhost:4173/**
```

### 6. Run the Application

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Available Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`     | Start development server         |
| `npm test`        | Run automated verification suite |
| `npm run lint`    | Run Oxlint                       |
| `npm run build`   | Type-check and build application |
| `npm run preview` | Preview production build         |

## Database Structure

DuesDock uses Supabase PostgreSQL.

| Table               | Purpose                                 |
| ------------------- | --------------------------------------- |
| `profiles`        | User profiles and preferences           |
| `categories`      | Income and expense categories           |
| `transactions`    | Financial transaction records           |
| `budgets`         | Monthly and category budgets            |
| `payments`        | Payable and receivable obligations      |
| `payment_records` | Partial payments and settlement records |

Row-Level Security policies restrict access to user-owned records. Receipt files are stored in a private Supabase Storage bucket with access controlled by storage policies.

## Deployment

<p align="center">
  <img src="https://img.shields.io/badge/Hosted_on-Vercel-000000?style=flat-square&logo=vercel" />
  <img src="https://img.shields.io/badge/Backend-Supabase-3FCF8E?style=flat-square&logo=supabase" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql" />
</p>

**Production URL:** https://duesdock.vercel.app

DuesDock is deployed on Vercel with the GitHub repository connected to the configured deployment branch.

| Setting          | Value             |
| ---------------- | ----------------- |
| Framework        | Vite              |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |

Configure the required environment variables in Vercel before deployment.

## Engineering Team

| # | Name                            | Role           | Profile                                                                                                           |
| - | ------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1 | Sai Subhash Kolanu              | Lead Developer | [GitHub](https://github.com/Subhashkolanu) · [LinkedIn](https://www.linkedin.com/in/sai-subhash-kolanu-358ba0376/) |
| 2 | Kolisetty Madhavi Venkata Durga | Team Member    | [GitHub](https://github.com/madhavikolisetty717)                                                                   |
| 3 | Katta Lakshmi Lahari            | Team Member    |                                                                                                                   |
| 4 | Katragadda Anjali Durga         | Team Member    | [GitHub](https://github.com/anjalidurgakatragadda-glitch)                                                          |
| 5 | Katla Venu                      | Team Member    | [GitHub](https://github.com/katlakishore86-oss)                                                                    |

## Links

- **Live Application:** https://duesdock.vercel.app/
- **GitHub Repository:** https://github.com/Subhashkolanu/DuesDock

---

<p align="center">
  <strong>DuesDock</strong>
  <br />
  Track Smarter. Manage Better.
  <br /><br />
  Built with React, TypeScript & Supabase.
</p>
