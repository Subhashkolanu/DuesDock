# DuesDock — Comprehensive Technical Project Audit

**Document Version:** 1.0.0  
**Audit Date:** November 15, 2026  
**Auditor:** Senior Software Architect & Technical Lead  
**Repository:** [https://github.com/Subhashkolanu/DuesDock](https://github.com/Subhashkolanu/DuesDock)  
**Production URL:** [https://duesdock.vercel.app](https://duesdock.vercel.app)  

---

## 1. Executive Summary & Project Identity

**DuesDock** is a production-grade personal finance, expense auditing, and debt/payment-tracking web platform. It addresses the fragmentation of personal financial record-keeping by unifying transaction logging, multi-category budgeting, installment payment tracking, and visual analytics into a single reactive application.

| Attribute | Specification |
| :--- | :--- |
| **Application Name** | DuesDock |
| **System Classification** | Personal Financial Information Management System (FIMS) |
| **Architectural Model** | Single Page Application (SPA) + Backend-as-a-Service (BaaS) |
| **Frontend Framework** | React 19.3.0, Vite 8.3.0, TypeScript 5.8 |
| **Styling Paradigm** | Tailwind CSS v4.0 with Custom Glassmorphism / Liquid Glass Design System |
| **Backend & Database** | Supabase Cloud (PostgreSQL 15+), Supabase Auth, Supabase Storage |
| **State Management** | Zustand (Auth & UI State), TanStack Query / Reactive Custom Events |
| **Data Visualization** | Recharts (Responsive Area, Bar, and Donut Charts) |
| **Hosting & CI/CD** | Vercel Edge Hosting, GitHub Actions Automated Verification |
| **Authentication** | Supabase Auth with Google OAuth 2.0 (PKCE Protocol) |

---

## 2. Complete Codebase & Architectural Inventory

### 2.1 Directory Structure Breakdown
```
DuesDock/
├── public/
│   ├── assets/
│   │   ├── branding/ (duesdock-logo.svg, duesdock-symbol.svg, favicon.svg)
│   │   └── team/ (sai-subhash-kolanu.jpg, madhavi-kolisetty.jpg, katta-lakshmi-lahari.jpg, katragadda-anjali-durga.jpg, katla-venu.jpg)
│   └── site.webmanifest
├── src/
│   ├── components/
│   │   ├── auth/ (AuthModal, ProtectedRoute)
│   │   ├── budgets/ (BudgetModal, BudgetProgressBar, BudgetSummaryCard)
│   │   ├── dashboard/ (CashFlowWidget, RecentTransactionsCard, ObligationsSummaryCard)
│   │   ├── layout/ (Navbar, Sidebar, Footer, LiquidGlassBackground, ThemeToggle)
│   │   ├── payments/ (PaymentModal, InstallmentRecordModal, PaymentStatusBadge)
│   │   ├── transactions/ (TransactionModal, ReceiptUploader, CategoryFilter)
│   │   └── ui/ (GlassCard, Modal, Button, Input, Dropdown, Tabs)
│   ├── lib/
│   │   ├── supabase.ts (Client initialization, auth helpers, storage helpers)
│   │   ├── categories.ts (Default category definitions, icons, color mappings)
│   │   ├── dateUtils.ts (Timezone-safe month formatting, date range calculations)
│   │   └── exportUtils.ts (CSV generation, sanitized ledger exports)
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── PaymentsPage.tsx
│   │   ├── BudgetsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── AboutPage.tsx
│   │   └── LoginPage.tsx
│   ├── services/
│   │   ├── transactionService.ts (CRUD operations, receipt upload, CSV export)
│   │   ├── paymentService.ts (Obligations CRUD, installments, status engine)
│   │   └── budgetService.ts (Monthly category budget allocation & consumption)
│   ├── types/
│   │   ├── database.types.ts (PostgreSQL typed schema interfaces)
│   │   └── ui.types.ts (Theme, navigation, modal states)
│   ├── App.tsx (Root route definitions & theme provider)
│   ├── main.tsx (DOM mount point)
│   └── index.css (Tailwind CSS v4 directives & glassmorphic token utilities)
├── supabase/
│   └── migrations/
│       ├── 20261112000001_personal_finance_schema.sql
│       └── 20261114000001_payments_system.sql
├── scripts/
│   ├── verify-all.mjs (27-case automated test harness)
│   └── test-supabase-connection.mjs
└── package.json (Dependency manifests)
```

---

## 3. Verified Database Schema & RLS Architecture

The database architecture is designed with **zero cross-tenant data leakage** by applying PostgreSQL Row-Level Security (RLS) to every user-facing table.

### 3.1 Table Definitions

#### 1. `profiles`
Tracks user preferences, display settings, and baseline budgeting limits.
- `id`: `uuid` (Primary Key, references `auth.users.id` on delete cascade)
- `email`: `text` (Not null)
- `full_name`: `text` (Nullable)
- `avatar_url`: `text` (Nullable)
- `preferred_currency`: `text` (Default `'USD'`, check in `('USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD')`)
- `monthly_budget_target`: `numeric(12,2)` (Default `0.00`, check `>= 0`)
- `is_onboarded`: `boolean` (Default `false`)
- `created_at`: `timestamptz` (Default `now()`)
- `updated_at`: `timestamptz` (Default `now()`)

#### 2. `categories`
Hierarchical classification system supporting system defaults and user custom categories.
- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `user_id`: `uuid` (Nullable, references `profiles.id` on delete cascade; null signifies global system category)
- `name`: `text` (Not null)
- `type`: `text` (Check in `('expense', 'income')`)
- `icon`: `text` (Default `'Tag'`, Lucide icon identifier)
- `color`: `text` (Default `'#059669'`, hex color string)
- `is_system`: `boolean` (Default `false`)
- `created_at`: `timestamptz` (Default `now()`)

#### 3. `transactions`
The immutable financial ledger recording inflows and outflows.
- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `user_id`: `uuid` (References `profiles.id` on delete cascade)
- `category_id`: `uuid` (Nullable, references `categories.id` on delete set null)
- `type`: `text` (Check in `('expense', 'income')`)
- `amount`: `numeric(12,2)` (Check `amount > 0`)
- `transaction_date`: `date` (Default `current_date`)
- `payment_method`: `text` (Check in `('credit_card', 'debit_card', 'cash', 'bank_transfer', 'upi', 'other')`)
- `merchant`: `text` (Nullable, counterparty name)
- `notes`: `text` (Nullable)
- `receipt_path`: `text` (Nullable, relative path inside Supabase Storage `receipts` bucket)
- `created_at`: `timestamptz` (Default `now()`)
- `updated_at`: `timestamptz` (Default `now()`)

#### 4. `budgets`
Category spending caps defined on a monthly calendar window.
- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `user_id`: `uuid` (References `profiles.id` on delete cascade)
- `category_id`: `uuid` (References `categories.id` on delete cascade)
- `month`: `text` (Format `'YYYY-MM'`, e.g., `'2026-11'`)
- `budget_limit`: `numeric(12,2)` (Check `budget_limit >= 0`)
- `created_at`: `timestamptz` (Default `now()`)
- *Unique Constraint:* `(user_id, category_id, month)`

#### 5. `payments`
Tracks contractual receivables (money owed to user) and payables (money user owes).
- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `user_id`: `uuid` (References `profiles.id` on delete cascade)
- `title`: `text` (Obligation description)
- `party_name`: `text` (Creditor or Debtor name)
- `direction`: `text` (Check in `('payable', 'receivable')`)
- `total_amount`: `numeric(12,2)` (Check `total_amount > 0`)
- `paid_amount`: `numeric(12,2)` (Default `0.00`, check `paid_amount >= 0`)
- `due_date`: `date` (Maturity date)
- `category_id`: `uuid` (Nullable, references `categories.id` on delete set null)
- `status`: `text` (Check in `('pending', 'partially_paid', 'paid', 'overdue', 'cancelled')`)
- `notes`: `text` (Nullable)
- `created_at`: `timestamptz` (Default `now()`)
- `updated_at`: `timestamptz` (Default `now()`)

#### 6. `payment_records`
Audit trail of partial or full settlement installments linked to a parent payment.
- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `payment_id`: `uuid` (References `payments.id` on delete cascade)
- `user_id`: `uuid` (References `profiles.id` on delete cascade)
- `amount`: `numeric(12,2)` (Check `amount > 0`)
- `payment_date`: `date` (Default `current_date`)
- `payment_method`: `text` (Check in `('credit_card', 'debit_card', 'cash', 'bank_transfer', 'upi', 'other')`)
- `notes`: `text` (Nullable)
- `created_at`: `timestamptz` (Default `now()`)

---

### 3.2 Security Matrix & Row-Level Security (RLS) Policies

All tables enforce Row Level Security (`alter table ... enable row level security;`).

| Table Name | Operation | Policy Name | Enforcement Clause |
| :--- | :--- | :--- | :--- |
| `profiles` | SELECT | `Users can view own profile` | `auth.uid() = id` |
| `profiles` | INSERT | `Users can insert own profile` | `with check (auth.uid() = id)` |
| `profiles` | UPDATE | `Users can update own profile` | `auth.uid() = id` |
| `categories` | SELECT | `Categories viewable by system or creator` | `is_system = true OR auth.uid() = user_id` |
| `categories` | INSERT | `Users can insert custom categories` | `with check (auth.uid() = user_id AND is_system = false)` |
| `categories` | UPDATE | `Users can update own custom categories` | `auth.uid() = user_id AND is_system = false` |
| `categories` | DELETE | `Users can delete own custom categories` | `auth.uid() = user_id AND is_system = false` |
| `transactions` | ALL | `Users can view/insert/update/delete own transactions` | `auth.uid() = user_id` |
| `budgets` | ALL | `Users can view/insert/update/delete own budgets` | `auth.uid() = user_id` |
| `payments` | ALL | `Users can view/insert/update/delete own payments` | `auth.uid() = user_id` |
| `payment_records` | ALL | `Users can view/insert/update/delete own payment records` | `auth.uid() = user_id` |
| `storage.objects` | ALL | `Receipts folder isolation` | `bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text` |

---

## 4. Business Logic & Mathematical Formulations

### 4.1 Cash Flow Calculations
$$\text{Total Inflow} = \sum_{i \in T_{\text{income}}} A_i$$
$$\text{Total Outflow} = \sum_{j \in T_{\text{expense}}} A_j$$
$$\text{Net Cash Flow} = \text{Total Inflow} - \text{Total Outflow}$$

### 4.2 Savings Rate Formula
$$\text{Savings Rate (\%)} = \begin{cases} \left( \frac{\text{Net Cash Flow}}{\text{Total Inflow}} \right) \times 100, & \text{if } \text{Total Inflow} > 0 \\ 0.00, & \text{if } \text{Total Inflow} \le 0 \end{cases}$$

### 4.3 Payment Obligation State Machine Engine
Let $P_T$ be `total_amount`, $P_P$ be `paid_amount`, $D_{\text{due}}$ be `due_date`, and $D_{\text{today}}$ be current calendar date.
$$\text{Status}(P) = \begin{cases} 
\text{cancelled}, & \text{if explicitly flagged as cancelled} \\
\text{paid}, & \text{if } P_P \ge P_T \text{ and } P_T > 0 \\
\text{overdue}, & \text{if } D_{\text{due}} < D_{\text{today}} \text{ and } P_P < P_T \\
\text{partially\_paid}, & \text{if } 0 < P_P < P_T \text{ and } D_{\text{due}} \ge D_{\text{today}} \\
\text{pending}, & \text{if } P_P = 0 \text{ and } D_{\text{due}} \ge D_{\text{today}}
\end{cases}$$

### 4.4 Installment Validation Rule
$$\Delta P \le (P_T - P_P)$$
Where $\Delta P$ is the incoming installment amount. Attempting to record an installment where $\Delta P > (P_T - P_P)$ is rejected by application validation and database constraint checks.

---

## 5. Automated Verification & Testing Coverage

The verification suite (`scripts/verify-all.mjs`) validates 27 functional constraints across 5 modules:

1. **Date & Timezone Utilities (4 Tests):**
   - Verified `getCurrentMonthKey` produces valid `YYYY-MM`.
   - Verified `getLastMonthKey` computes calendar rollbacks across year boundaries.
   - Verified `isDateInCurrentYear` correctly matches current year boundaries.
   - Verified `isDateWithinMonths` includes rolling $N$-month horizons.

2. **Financial Calculations Engine (5 Tests):**
   - Verified Total Inflow aggregation matches ledger sums.
   - Verified Total Outflow aggregation matches expense sums.
   - Verified Net Cash Flow accounts for surplus and deficit scenarios.
   - Verified Savings Rate handles positive, negative, and zero denominator edge cases.
   - Verified Monthly Budget Remaining deducts category expenditures from assigned caps.

3. **Analytics Subtitle Resolver (3 Tests):**
   - Verified transaction with merchant displays merchant name as secondary metadata.
   - Verified transaction without merchant gracefully falls back to category title.
   - Verified zero-expense periods display appropriate empty-state guidance.

4. **Payment Obligations Engine (6 Tests):**
   - Verified pending obligation status for unpaid future obligations.
   - Verified partially_paid obligation status when partial settlement occurs.
   - Verified paid obligation status when cumulative installments equal or exceed principal.
   - Verified overdue obligation status when due date expires.
   - Verified installment limit constraint prevents overpayment.
   - Verified outstanding balance computation across receivables and payables.

5. **Developers & Identity Integrity (9 Tests):**
   - Verified exact 5-developer roster order.
   - Verified Sai Subhash Kolanu Lead Developer designation, image, and social profiles.
   - Verified Kolisetty Madhavi Venkata Durga identity, image, and MD fallback initials.
   - Verified Katta Lakshmi Lahari identity, image, and LL fallback initials.
   - Verified Katragadda Anjali Durga identity, image, and AD fallback initials.
   - Verified Katla Venu identity, image, and KV fallback initials.
   - Verified legacy collegiate text and redundant buttons are eradicated.
   - Verified non-overlapping, unique image file paths on disk.
   - Verified binary presence and valid file sizes in `public/assets/team/`.

**Test Outcome:** **27/27 Tests Passed (100% Success Rate).**

---

## 6. Development Team Roster

1. **Sai Subhash Kolanu** — Lead Developer & Architect  
   GitHub: [Subhashkolanu](https://github.com/Subhashkolanu)  
   LinkedIn: [sai-subhash-kolanu-358ba0376](https://www.linkedin.com/in/sai-subhash-kolanu-358ba0376/)  
   Email: `saisubhash.kolanu@gmail.com`  
   Assigned Asset: `/assets/team/sai-subhash-kolanu.jpg`  

2. **Kolisetty Madhavi Venkata Durga** — Full Stack Developer  
   GitHub: [madhavikolisetty717](https://github.com/madhavikolisetty717)  
   Initials Fallback: `MD`  
   Assigned Asset: `/assets/team/madhavi-kolisetty.jpg`  

3. **Katta Lakshmi Lahari** — Frontend Developer  
   Initials Fallback: `LL`  
   Assigned Asset: `/assets/team/katta-lakshmi-lahari.jpg`  

4. **Katragadda Anjali Durga** — UI/UX & Quality Engineer  
   GitHub: [anjalidurgakatragadda-glitch](https://github.com/anjalidurgakatragadda-glitch)  
   Initials Fallback: `AD`  
   Assigned Asset: `/assets/team/katragadda-anjali-durga.jpg`  

5. **Katla Venu** — Database & Backend Developer  
   GitHub: [katlakishore86-oss](https://github.com/katlakishore86-oss)  
   Initials Fallback: `KV`  
   Assigned Asset: `/assets/team/katla-venu.jpg`  
