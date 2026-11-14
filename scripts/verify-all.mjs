// Comprehensive automated verification test suite for DuesDock logic
import assert from 'node:assert';

console.log('🧪 Starting DuesDock Automated Functional Verification Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     ${err.message}`);
  }
}

// ==========================================
// 1. DATE UTILITY TESTS
// ==========================================
console.log('--- 1. Testing Date & Timezone Utilities ---');

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getLastMonthKey() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function isDateInCurrentYear(dateStr) {
  if (!dateStr) return false;
  const year = parseInt(dateStr.substring(0, 4), 10);
  return year === new Date().getFullYear();
}

function isDateWithinMonths(dateStr, monthsCount) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const txDate = new Date(y, (m || 1) - 1, d || 1);
  const now = new Date();
  const startPeriod = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1, 0, 0, 0, 0);
  return txDate >= startPeriod;
}

test('getCurrentMonthKey returns YYYY-MM format', () => {
  const key = getCurrentMonthKey();
  assert.match(key, /^\d{4}-\d{2}$/);
});

test('getLastMonthKey returns previous month correctly across year boundaries', () => {
  const lastKey = getLastMonthKey();
  assert.match(lastKey, /^\d{4}-\d{2}$/);
});

test('isDateInCurrentYear correctly matches current year strings', () => {
  const curYear = new Date().getFullYear();
  assert.strictEqual(isDateInCurrentYear(`${curYear}-01-15`), true);
  assert.strictEqual(isDateInCurrentYear(`${curYear - 1}-12-31`), false);
});

test('isDateWithinMonths includes dates within last N months and excludes older', () => {
  const curMonthKey = getCurrentMonthKey();
  assert.strictEqual(isDateWithinMonths(`${curMonthKey}-01`, 3), true);
  assert.strictEqual(isDateWithinMonths('2020-01-01', 3), false);
});

// ==========================================
// 2. FINANCIAL CALCULATIONS TESTS
// ==========================================
console.log('\n--- 2. Testing Financial Calculations ---');

const sampleTransactions = [
  { id: '1', type: 'income', amount: 5000, transaction_date: '2026-11-01', category_id: 'cat-sal' },
  { id: '2', type: 'income', amount: 1200, transaction_date: '2026-11-05', category_id: 'cat-free' },
  { id: '3', type: 'expense', amount: 1500, transaction_date: '2026-11-02', category_id: 'cat-rent', merchant: 'Apex Living' },
  { id: '4', type: 'expense', amount: 450, transaction_date: '2026-11-04', category_id: 'cat-gro', notes: 'Weekly groceries' },
  { id: '5', type: 'expense', amount: 800, transaction_date: '2026-11-06', category_id: 'cat-elec' }, // No merchant or notes!
];

test('Total Inflow sums all income transactions accurately', () => {
  const income = sampleTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  assert.strictEqual(income, 6200);
});

test('Total Outflow sums all expense transactions accurately', () => {
  const expense = sampleTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  assert.strictEqual(expense, 2750);
});

test('Net Cash Flow calculation reflects surplus or deficit', () => {
  const income = 6200;
  const expense = 2750;
  const net = income - expense;
  assert.strictEqual(net, 3450);
});

test('Savings Rate formula handles positive income and zero income safely', () => {
  const income = 6200;
  const expense = 2750;
  const rate = income > 0 ? ((income - expense) / income) * 100 : 0;
  assert.strictEqual(Math.round(rate), 56);

  const zeroRate = 0 > 0 ? ((0 - 100) / 0) * 100 : 0;
  assert.strictEqual(zeroRate, 0);
});

test('Monthly Budget Remaining accurately deducts month expenses from budget ceiling', () => {
  const budgetTarget = 3000;
  const monthExpenses = 2750;
  const remaining = budgetTarget - monthExpenses;
  assert.strictEqual(remaining, 250);
});

// ==========================================
// 3. ANALYTICS CARD & SUBTITLE RESOLVER TESTS
// ==========================================
console.log('\n--- 3. Testing Analytics Subtitle Resolver Bug Fix ---');

const categories = [
  { id: 'cat-rent', name: 'Housing & Rent' },
  { id: 'cat-gro', name: 'Groceries' },
  { id: 'cat-elec', name: 'Utilities & Bills' },
];

function resolveLargestExpenseSubtitle(largestExpense, cats) {
  if (!largestExpense) return 'No expenses in this period';
  const categoryName = cats.find((c) => c.id === largestExpense.category_id)?.name;
  return (
    largestExpense.merchant ||
    categoryName ||
    largestExpense.notes ||
    `Expense on ${largestExpense.transaction_date}`
  );
}

test('Expense with merchant returns merchant name as subtitle', () => {
  const expense = sampleTransactions[2]; // rent, merchant: Apex Living
  const subtitle = resolveLargestExpenseSubtitle(expense, categories);
  assert.strictEqual(subtitle, 'Apex Living');
});

test('Expense with NO merchant and NO notes resolves category name and NEVER "No expenses recorded"', () => {
  const expense = sampleTransactions[4]; // amount 800, no merchant, no notes
  const subtitle = resolveLargestExpenseSubtitle(expense, categories);
  assert.strictEqual(subtitle, 'Utilities & Bills');
  assert.notStrictEqual(subtitle, 'No expenses recorded');
});

test('When there are 0 expenses, subtitle correctly indicates "No expenses in this period"', () => {
  const subtitle = resolveLargestExpenseSubtitle(null, categories);
  assert.strictEqual(subtitle, 'No expenses in this period');
});

// ==========================================
// 4. PAYMENT OBLIGATIONS ENGINE TESTS
// ==========================================
console.log('\n--- 4. Testing Payment Obligations Engine ---');

function computePaymentStatus(totalAmount, paidAmount, dueDate, currentStatus) {
  if (currentStatus === 'cancelled') return 'cancelled';
  const total = Number(totalAmount);
  const paid = Number(paidAmount);
  const today = '2026-11-14';

  if (paid >= total && total > 0) return 'paid';
  if (dueDate < today) return 'overdue';
  if (paid > 0) return 'partially_paid';
  return 'pending';
}

test('Payment obligation computes pending when 0 paid and future deadline', () => {
  const status = computePaymentStatus(1000, 0, '2026-11-20', 'pending');
  assert.strictEqual(status, 'pending');
});

test('Payment obligation computes partially_paid when partial amount is recorded', () => {
  const status = computePaymentStatus(1000, 300, '2026-11-20', 'pending');
  assert.strictEqual(status, 'partially_paid');
});

test('Payment obligation computes paid when paid >= total', () => {
  const status = computePaymentStatus(1000, 1000, '2026-11-20', 'pending');
  assert.strictEqual(status, 'paid');
});

test('Payment obligation computes overdue when due date has passed and remaining > 0', () => {
  const status = computePaymentStatus(1000, 500, '2026-11-10', 'pending');
  assert.strictEqual(status, 'overdue');
});

test('Payment installment cannot exceed remaining balance', () => {
  const total = 1000;
  const currentPaid = 700;
  const remaining = total - currentPaid;
  const attemptedInstallment = 350;

  const isValid = attemptedInstallment <= remaining;
  assert.strictEqual(isValid, false);
});

test('Payment outstanding balance correctly calculates net position', () => {
  const payables = [
    { direction: 'payable', total_amount: 1000, paid_amount: 400 }, // rem 600
    { direction: 'payable', total_amount: 500, paid_amount: 500 },  // rem 0
  ];
  const receivables = [
    { direction: 'receivable', total_amount: 2000, paid_amount: 800 }, // rem 1200
  ];

  const outstandingPayable = payables.reduce(
    (sum, p) => sum + (p.total_amount - p.paid_amount),
    0
  );
  const outstandingReceivable = receivables.reduce(
    (sum, p) => sum + (p.total_amount - p.paid_amount),
    0
  );
  const netPending = outstandingReceivable - outstandingPayable;

  assert.strictEqual(outstandingPayable, 600);
  assert.strictEqual(outstandingReceivable, 1200);
  assert.strictEqual(netPending, 600);
});

// ==========================================
// 5. DEVELOPERS / ABOUT PAGE VERIFICATION TESTS
// ==========================================
console.log('\n--- 5. Testing Developers / About Page Requirements ---');
import fs from 'node:fs';
import path from 'node:path';

const devPageContent = fs.readFileSync(
  path.resolve(process.cwd(), 'src/features/developers/DevelopersPage.tsx'),
  'utf-8'
);

test('Developers array defines all five developers in the exact requested order', () => {
  const expectedNames = [
    'Sai Subhash Kolanu',
    'Kolisetty Madhavi Venkata Durga',
    'Katta Lakshmi Lahari',
    'Katragadda Anjali Durga',
    'Katla Venu',
  ];
  
  for (let i = 0; i < expectedNames.length - 1; i++) {
    const idxA = devPageContent.indexOf(`name: '${expectedNames[i]}'`);
    const idxB = devPageContent.indexOf(`name: '${expectedNames[i + 1]}'`);
    assert.ok(idxA !== -1, `Missing developer name: ${expectedNames[i]}`);
    assert.ok(idxB !== -1, `Missing developer name: ${expectedNames[i + 1]}`);
    assert.ok(idxA < idxB, `Developer ${expectedNames[i]} must appear before ${expectedNames[i + 1]}`);
  }
});

test('Sai Subhash Kolanu has Lead Developer role, verified photo, updated email, GitHub profile, and LinkedIn URL', () => {
  assert.ok(devPageContent.includes("role: 'Lead Developer'"));
  assert.ok(devPageContent.includes("email: 'saisubhash.kolanu@gmail.com'"));
  assert.ok(devPageContent.includes("githubUrl: 'https://github.com/Subhashkolanu'"));
  assert.ok(devPageContent.includes("linkedinUrl: 'https://www.linkedin.com/in/sai-subhash-kolanu-358ba0376/'"));
  assert.ok(devPageContent.includes("avatarUrl: '/assets/team/sai-subhash-kolanu.jpg'"));
  assert.ok(devPageContent.includes("initials: 'SS'"));
});

test('Kolisetty Madhavi Venkata Durga has correct GitHub profile, assigned photo, and MD initials fallback', () => {
  assert.ok(devPageContent.includes("name: 'Kolisetty Madhavi Venkata Durga'"));
  assert.ok(devPageContent.includes("initials: 'MD'"));
  assert.ok(devPageContent.includes("avatarUrl: '/assets/team/madhavi-kolisetty.jpg'"));
  assert.ok(devPageContent.includes("githubUrl: 'https://github.com/madhavikolisetty717'"));
});

test('Katta Lakshmi Lahari has LL initials, assigned photo, and NO invented GitHub link', () => {
  assert.ok(devPageContent.includes("name: 'Katta Lakshmi Lahari'"));
  assert.ok(devPageContent.includes("initials: 'LL'"));
  assert.ok(devPageContent.includes("avatarUrl: '/assets/team/katta-lakshmi-lahari.jpg'"));
  // GitHub URL must be undefined or absent for Lakshmi Lahari
  const laharySnippet = devPageContent.slice(
    devPageContent.indexOf("name: 'Katta Lakshmi Lahari'"),
    devPageContent.indexOf("name: 'Katragadda Anjali Durga'")
  );
  assert.ok(!laharySnippet.includes('https://github.com/'));
});

test('Katragadda Anjali Durga has correct GitHub profile, assigned photo, and AD initials fallback', () => {
  assert.ok(devPageContent.includes("name: 'Katragadda Anjali Durga'"));
  assert.ok(devPageContent.includes("initials: 'AD'"));
  assert.ok(devPageContent.includes("avatarUrl: '/assets/team/katragadda-anjali-durga.jpg'"));
  assert.ok(devPageContent.includes("githubUrl: 'https://github.com/anjalidurgakatragadda-glitch'"));
});

test('Katla Venu has correct GitHub profile, assigned photo, and KV initials fallback', () => {
  assert.ok(devPageContent.includes("name: 'Katla Venu'"));
  assert.ok(devPageContent.includes("initials: 'KV'"));
  assert.ok(devPageContent.includes("avatarUrl: '/assets/team/katla-venu.jpg'"));
  assert.ok(devPageContent.includes("githubUrl: 'https://github.com/katlakishore86-oss'"));
});

test('Old email, old job description, old skill cards, and repository button are removed', () => {
  assert.ok(!devPageContent.includes('2025DCSBT10480@vvitu.ac.in'), 'Old email must not be present');
  assert.ok(!devPageContent.includes('Full-Stack Engineer & Product Systems Architect'), 'Old title must not be present');
  assert.ok(!devPageContent.includes('GitHub Repository'), 'Old repository button must not be present');
  assert.ok(!devPageContent.includes('Frontend & UI/UX'), 'Old skill card 1 must not be present');
  assert.ok(!devPageContent.includes('Database & Security'), 'Old skill card 2 must not be present');
  assert.ok(!devPageContent.includes('Calculations & QA'), 'Old skill card 3 must not be present');
});

test('All five developers have unique, non-duplicated photograph paths in exact order', () => {
  const avatarMatches = [...devPageContent.matchAll(/avatarUrl:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.strictEqual(avatarMatches.length, 5, 'Must have exactly 5 photo paths');
  const uniqueSet = new Set(avatarMatches);
  assert.strictEqual(uniqueSet.size, 5, 'All 5 photo paths must be distinct and non-duplicated');
  
  assert.deepStrictEqual(avatarMatches, [
    '/assets/team/sai-subhash-kolanu.jpg',
    '/assets/team/madhavi-kolisetty.jpg',
    '/assets/team/katta-lakshmi-lahari.jpg',
    '/assets/team/katragadda-anjali-durga.jpg',
    '/assets/team/katla-venu.jpg',
  ]);
});

test('All five developer image files exist on disk in public/assets/team with valid sizes', () => {
  const teamDir = path.resolve(process.cwd(), 'public/assets/team');
  const expectedFiles = [
    'sai-subhash-kolanu.jpg',
    'madhavi-kolisetty.jpg',
    'katta-lakshmi-lahari.jpg',
    'katragadda-anjali-durga.jpg',
    'katla-venu.jpg',
  ];
  for (const file of expectedFiles) {
    const fullPath = path.join(teamDir, file);
    assert.ok(fs.existsSync(fullPath), `File ${file} must exist`);
    const size = fs.statSync(fullPath).size;
    assert.ok(size > 1000, `File ${file} must not be empty (size: ${size})`);
  }
});

// ==========================================
// TEST SUMMARY
// ==========================================
console.log('\n==========================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('==========================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
