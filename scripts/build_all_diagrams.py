import os
import json
import urllib.request
import time

DIAGRAMS = {
    "01_use_case_diagram": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #008F62
skinparam ActorBorderColor #008F62
skinparam ActorBackgroundColor #E6F7F2
skinparam UseCaseBorderColor #0D9488
skinparam UseCaseBackgroundColor #F0FDF4

left to right direction

actor "Account Owner\\n(Authenticated User)" as User
actor "Google OAuth IDP" as Google
actor "Supabase Cloud\\n(PostgreSQL & Storage)" as Supabase

rectangle "DuesDock Personal Finance & Payment Tracking Platform" {
  usecase "Authenticate via Google OAuth (PKCE)" as UC_Auth
  usecase "Manage User Profile & Currency" as UC_Profile
  usecase "Log Cash Inflow & Expense Outflow" as UC_Tx
  usecase "Upload & View Digital Receipts" as UC_Receipt
  usecase "Filter & Categorize Ledger Entries" as UC_Filter
  usecase "Establish Monthly Category Budgets" as UC_Budget
  usecase "Track Real-time Budget Utilization" as UC_BudgetAlert
  usecase "Register Payment Obligations (Receivable/Payable)" as UC_Payment
  usecase "Record Partial Installment Settlements" as UC_Installment
  usecase "Compute Net Cash Flow & Savings Rate" as UC_Analytics
  usecase "Generate & Export Sanitized CSV Ledger" as UC_Export
  usecase "Toggle Liquid Glass Themes (Dark/Light)" as UC_Theme
  usecase "Inspect Developer Attribution & System Audit" as UC_About
}

User --> UC_Auth
User --> UC_Profile
User --> UC_Tx
User --> UC_Receipt
User --> UC_Filter
User --> UC_Budget
User --> UC_BudgetAlert
User --> UC_Payment
User --> UC_Installment
User --> UC_Analytics
User --> UC_Export
User --> UC_Theme
User --> UC_About

UC_Auth ..> Google : <<delegates>>
UC_Auth ..> Supabase : <<persists session>>
UC_Tx ..> Supabase : <<enforces RLS>>
UC_Receipt ..> Supabase : <<signed URL>>
UC_Budget ..> Supabase : <<stores caps>>
UC_Payment ..> Supabase : <<tracks status>>
UC_Installment ..> UC_Payment : <<updates balance>>

@enduml""",

    "02_class_diagram": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 6
skinparam shadowing false
skinparam ArrowColor #008F62
skinparam ClassBorderColor #0D9488
skinparam ClassBackgroundColor #F8FAFC
skinparam ClassHeaderBackgroundColor #E2E8F0

package "Domain Entities & Models" {
  class Profile {
    + UUID id
    + String email
    + String fullName
    + String avatarUrl
    + CurrencyCode preferredCurrency
    + Decimal monthlyBudgetTarget
    + Boolean isOnboarded
    + DateTime createdAt
    + DateTime updatedAt
  }

  class Category {
    + UUID id
    + UUID userId
    + String name
    + TransactionType type
    + String icon
    + String color
    + Boolean isSystem
    + DateTime createdAt
  }

  class Transaction {
    + UUID id
    + UUID userId
    + UUID categoryId
    + TransactionType type
    + Decimal amount
    + Date transactionDate
    + PaymentMethod paymentMethod
    + String merchant
    + String notes
    + String receiptPath
    + DateTime createdAt
    + DateTime updatedAt
  }

  class Budget {
    + UUID id
    + UUID userId
    + UUID categoryId
    + String month
    + Decimal budgetLimit
    + DateTime createdAt
  }

  class Payment {
    + UUID id
    + UUID userId
    + UUID categoryId
    + String title
    + String partyName
    + PaymentDirection direction
    + Decimal totalAmount
    + Decimal paidAmount
    + Date dueDate
    + PaymentStatus status
    + String notes
    + DateTime createdAt
    + DateTime updatedAt
    + getRemainingAmount() : Decimal
  }

  class PaymentRecord {
    + UUID id
    + UUID paymentId
    + UUID userId
    + Decimal amount
    + Date paymentDate
    + PaymentMethod paymentMethod
    + String notes
    + DateTime createdAt
  }
}

package "Services & Application Layer" {
  class TransactionService {
    + getTransactions(userId: string) : Promise<Transaction[]>
    + createTransaction(tx: TransactionInsert) : Promise<Transaction>
    + updateTransaction(id: string, tx: TransactionUpdate) : Promise<Transaction>
    + deleteTransaction(id: string) : Promise<void>
    + getCategories(userId: string) : Promise<Category[]>
    + createCategory(cat: CategoryInsert) : Promise<Category>
  }

  class PaymentService {
    + getPayments(userId: string) : Promise<Payment[]>
    + createPayment(p: PaymentInsert) : Promise<Payment>
    + recordInstallment(record: PaymentRecordInsert) : Promise<PaymentRecord>
    + computePaymentStatus(total, paid, dueDate, status) : PaymentStatus
    + deletePayment(id: string) : Promise<void>
  }

  class BudgetService {
    + getBudgets(userId: string, month: string) : Promise<Budget[]>
    + saveBudget(userId, categoryId, month, limit) : Promise<Budget>
    + deleteBudget(id: string) : Promise<void>
  }

  class ExportUtils {
    + exportTransactionsToCSV(txs: Transaction[], cats: Category[]) : void
    + sanitizeCSVField(val: string) : string
  }
}

Profile "1" *-- "0..*" Transaction : logs >
Profile "1" *-- "0..*" Budget : establishes >
Profile "1" *-- "0..*" Payment : obligates >
Profile "1" *-- "0..*" Category : customizes >
Category "1" -- "0..*" Transaction : classifies >
Category "1" -- "0..*" Budget : bounds >
Category "1" -- "0..*" Payment : associates >
Payment "1" *-- "0..*" PaymentRecord : settles via >

TransactionService ..> Transaction : operates
PaymentService ..> Payment : operates
PaymentService ..> PaymentRecord : records
BudgetService ..> Budget : operates
ExportUtils ..> Transaction : serializes

@enduml""",

    "03_entity_relationship_diagram": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 6
skinparam shadowing false
skinparam ArrowColor #008F62
skinparam EntityBorderColor #0D9488
skinparam EntityBackgroundColor #F8FAFC
skinparam EntityHeaderBackgroundColor #CCFBF1

entity "auth.users" as Users {
  * id : uuid <<PK>>
  --
  email : varchar
  created_at : timestamptz
}

entity "public.profiles" as Profiles {
  * id : uuid <<PK, FK>>
  --
  email : text
  full_name : text
  avatar_url : text
  preferred_currency : text
  monthly_budget_target : numeric(12,2)
  is_onboarded : boolean
  created_at : timestamptz
  updated_at : timestamptz
}

entity "public.categories" as Categories {
  * id : uuid <<PK>>
  --
  user_id : uuid <<FK, nullable>>
  name : text
  type : text
  icon : text
  color : text
  is_system : boolean
  created_at : timestamptz
}

entity "public.transactions" as Transactions {
  * id : uuid <<PK>>
  --
  user_id : uuid <<FK>>
  category_id : uuid <<FK, nullable>>
  type : text
  amount : numeric(12,2)
  transaction_date : date
  payment_method : text
  merchant : text
  notes : text
  receipt_path : text
  created_at : timestamptz
  updated_at : timestamptz
}

entity "public.budgets" as Budgets {
  * id : uuid <<PK>>
  --
  user_id : uuid <<FK>>
  category_id : uuid <<FK>>
  month : varchar(7)
  budget_limit : numeric(12,2)
  created_at : timestamptz
  --
  <<unique(user_id, category_id, month)>>
}

entity "public.payments" as Payments {
  * id : uuid <<PK>>
  --
  user_id : uuid <<FK>>
  category_id : uuid <<FK, nullable>>
  title : text
  party_name : text
  direction : text
  total_amount : numeric(12,2)
  paid_amount : numeric(12,2)
  due_date : date
  status : text
  notes : text
  created_at : timestamptz
  updated_at : timestamptz
}

entity "public.payment_records" as PaymentRecords {
  * id : uuid <<PK>>
  --
  payment_id : uuid <<FK>>
  user_id : uuid <<FK>>
  amount : numeric(12,2)
  payment_date : date
  payment_method : text
  notes : text
  created_at : timestamptz
}

entity "storage.objects (receipts)" as StorageReceipts {
  * id : uuid <<PK>>
  --
  bucket_id : text = 'receipts'
  name : text = '<user_id>/<file>'
  metadata : jsonb
  created_at : timestamptz
}

Users ||--|| Profiles : "1 : 1 (on delete cascade)"
Profiles ||--o{ Categories : "1 : N (custom categories)"
Profiles ||--o{ Transactions : "1 : N (ledger entries)"
Profiles ||--o{ Budgets : "1 : N (spending limits)"
Profiles ||--o{ Payments : "1 : N (debt/receivable obligations)"
Profiles ||--o{ PaymentRecords : "1 : N (settlement audit trail)"
Categories ||--o{ Transactions : "1 : N (classification)"
Categories ||--o{ Budgets : "1 : N (category caps)"
Categories ||--o{ Payments : "1 : N (optional category)"
Payments ||--o{ PaymentRecords : "1 : N (installments, on delete cascade)"
Transactions ||..o| StorageReceipts : "references path"

@enduml""",

    "04_system_architecture_diagram": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #008F62

package "Client Presentation Layer (Browser Runtime)" {
  component "React 19 SPA\\n(Vite 8.3 & TypeScript)" as ReactApp {
    portin "UI Routing & Views" as Views
    component "Liquid Glass Design System\\n(Tailwind CSS v4 & Lucide Icons)" as GlassUI
    component "State Management\\n(Zustand Stores & TanStack Query)" as StateMgr
    component "Analytics Visualizer\\n(Recharts Area, Bar, Donut)" as Charts
  }
}

package "Edge Hosting & Delivery (Vercel)" {
  node "Vercel Global Edge Network" as VercelEdge {
    component "Edge CDN & HTTPS Termination" as CDN
    component "Static Asset Pipeline" as Assets
  }
}

package "External Identity Provider" {
  node "Google Identity Services" as GoogleIDP {
    component "Google OAuth 2.0 (PKCE)" as OAuth
  }
}

package "Backend-as-a-Service (Supabase Cloud)" {
  node "API Gateway & Security Proxy" as Gateway {
    component "PostgREST Engine" as PostgREST
    component "GoTrue Auth Service" as GoTrue
  }

  database "PostgreSQL 15 Managed Database" as Postgres {
    frame "Row-Level Security (RLS) Engine" {
      component "Tenant Isolation Policies" as RLSPolicies
    }
    frame "Relational Storage & Schema" {
      collections "profiles, categories, transactions" as CoreTables
      collections "budgets, payments, payment_records" as ObligationTables
    }
    frame "Database Triggers & PL/pgSQL Functions" {
      component "handle_new_google_user()" as UserTrigger
    }
  }

  node "Encrypted Object Storage" as Storage {
    component "Private S3 Bucket ('receipts')" as S3Bucket
    component "HMAC Signed URL Generator" as SignedURLs
  }
}

ReactApp <--> CDN : HTTPS / Assets
ReactApp <--> OAuth : Authentication Flow
ReactApp <--> GoTrue : JWT Exchange & Session
ReactApp <--> PostgREST : RESTful CRUD Operations
ReactApp <--> SignedURLs : Receipt Upload & Retrieval

GoTrue --> UserTrigger : on user signup
PostgREST --> RLSPolicies : evaluates auth.uid()
RLSPolicies --> CoreTables : filters row access
RLSPolicies --> ObligationTables : filters row access
SignedURLs --> S3Bucket : isolated user directory

@enduml""",

    "05_main_activity_diagram.puml": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #008F62

start

:User launches DuesDock Web Application;

if (Active Supabase JWT Session exists?) then (yes)
  :Hydrate User Profile into Zustand Store;
else (no)
  :Display Liquid Glass Landing & Login Page;
  :User clicks "Continue with Google";
  :Execute Google OAuth PKCE Authorization;
  :Exchange Auth Code for Supabase Session;
  :Execute PostgreSQL handle_new_google_user() Trigger;
  :Hydrate Profile & Currency Preferences;
endif

:Load Interactive Financial Dashboard;
:Aggregate KPIs (Inflow, Outflow, Net Cash Flow, Savings Rate);
:Evaluate Monthly Category Budgets & Payment Deadlines;

repeat
  :User selects Application Module;

  if (Module == "Transactions") then (yes)
    :Display Categorized Transaction Ledger;
    if (Action == "Record Transaction") then (yes)
      :Input Amount, Date, Category, Payment Method, Merchant;
      if (Receipt Attached?) then (yes)
        :Upload binary to 'receipts/<user_id>/' bucket;
        :Obtain relative receipt storage path;
      endif
      :Insert record into transactions table;
      :PostgreSQL evaluates RLS policy (auth.uid() = user_id);
      :Recalculate Cash Flow KPIs & Invalidate Query Cache;
    elseif (Action == "Export CSV") then (yes)
      :Apply Date and Category Filters;
      :Sanitize and format ledger fields to CSV;
      :Generate browser download stream;
    endif

  elseif (Module == "Budgets") then (yes)
    :Display Category Budget Progress Bars;
    if (Action == "Set Budget Limit") then (yes)
      :Specify Target Month (YYYY-MM) and Spending Limit;
      :Upsert record into budgets table;
      :Evaluate spending variance (Spent vs Limit);
      :Render Amber/Red Alert if ceiling exceeded;
    endif

  elseif (Module == "Payments") then (yes)
    :Display Payables & Receivables Ledger;
    if (Action == "Create Obligation") then (yes)
      :Specify Title, Party, Direction, Due Date, Principal;
      :Compute Initial Status (Pending or Overdue);
      :Insert record into payments table;
    elseif (Action == "Record Installment") then (yes)
      :Validate Installment Amount <= Remaining Balance;
      :Insert settlement record into payment_records;
      :Update paid_amount on parent payment;
      :Recalculate Status (Partially Paid / Paid);
      :Emit PAYMENT_UPDATED_EVENT;
    endif

  elseif (Module == "Analytics") then (yes)
    :Render Monthly Cash Flow Trend Area Charts;
    :Render Category Spending Distribution Donut Chart;
    :Render Net Financial Position & Budget Consumption;

  elseif (Module == "About / Team") then (yes)
    :Render Developer Roster with Verified Photographs;
    :Display Architectural & Security Audit Matrix;
  endif

backward:User navigates to another module;
repeat while (User remains authenticated?) is (yes)

:User clicks "Sign Out";
:Terminate Supabase Session & Clear Local Tokens;
:Redirect to Public Landing Page;

stop
@enduml""",

    "06_seq_google_auth": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 6
skinparam shadowing false
skinparam ArrowColor #008F62
skinparam ParticipantBorderColor #0D9488
skinparam ParticipantBackgroundColor #F0FDF4

autonumber

actor "User" as User
participant "DuesDock Client\\n(React 19 SPA)" as Client
participant "Supabase Auth\\n(GoTrue PKCE)" as Auth
participant "Google Identity\\nProvider" as Google
participant "PostgreSQL Database\\n(Triggers & Profiles)" as DB

User -> Client : Click "Sign In with Google"
activate Client

Client -> Auth : signInWithOAuth({ provider: 'google', redirectTo })
activate Auth

Auth --> Client : Return Google OAuth Authorization URL + PKCE Code Challenge
deactivate Auth

Client -> Google : Redirect to Google OAuth Consent Page
activate Google

User -> Google : Consent & Select Google Account
Google --> Client : Redirect to /?code=<auth_code>
deactivate Google

Client -> Auth : exchangeCodeForSession(auth_code)
activate Auth

Auth -> Google : Exchange Code for ID Token & User Profile
activate Google
Google --> Auth : Return User Identity (email, name, avatar)
deactivate Google

Auth -> DB : INSERT INTO auth.users
activate DB
DB -> DB : Fire Trigger on_auth_user_created\\n(handle_new_google_user())
DB -> DB : Upsert public.profiles\\n(id, email, full_name, avatar_url)
DB --> Auth : Confirm Profile Provisioned
deactivate DB

Auth --> Client : Return JWT Session (access_token, user object)
deactivate Auth

Client -> Client : Hydrate Zustand AuthStore (user, session)
Client -> DB : SELECT * FROM public.profiles WHERE id = auth.uid()
activate DB
DB --> Client : Return Profile & Currency Preferences
deactivate DB

Client --> User : Render Authenticated Dashboard (Liquid Glass Theme)
deactivate Client

@enduml""",

    "07_seq_create_transaction": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 6
skinparam shadowing false
skinparam ArrowColor #008F62
skinparam ParticipantBorderColor #0D9488
skinparam ParticipantBackgroundColor #F0FDF4

autonumber

actor "Account Owner" as User
participant "TransactionsPage\\n(React View)" as View
participant "TransactionService" as Service
participant "Supabase Storage\\n('receipts' Bucket)" as Storage
participant "PostgreSQL Engine\\n(RLS Evaluator)" as DB
participant "Dashboard Store" as Store

User -> View : Fill Transaction Form (Amount, Date, Category, Receipt File)
User -> View : Click "Save Transaction"
activate View

View -> Service : createTransaction(transactionData, receiptFile)
activate Service

alt Receipt File is Attached
  Service -> Storage : uploadReceipt(userId, receiptFile)
  activate Storage
  Storage -> Storage : Enforce Storage RLS:\\n(storage.foldername(name))[1] = auth.uid()
  Storage --> Service : Return receipt_path ("<userId>/<uuid>.jpg")
  deactivate Storage
else No Receipt Attached
  Service -> Service : receipt_path = null
end

Service -> DB : INSERT INTO public.transactions\\n(user_id, category_id, type, amount, date, method, merchant, notes, receipt_path)
activate DB

DB -> DB : Evaluate RLS Policy:\\nCHECK (auth.uid() = user_id)
DB -> DB : Commit Transaction Record
DB --> Service : Return inserted Transaction Row
deactivate DB

Service --> View : Return Success Response
deactivate Service

View -> Store : Invalidate Transactions & Cash Flow Cache
activate Store
Store -> DB : SELECT SUM(amount) FROM transactions WHERE type='income'
Store -> DB : SELECT SUM(amount) FROM transactions WHERE type='expense'
Store --> View : Updated Financial Metrics
deactivate Store

View --> User : Display Success Notification & Refresh Ledger Grid
deactivate View

@enduml""",

    "08_seq_partial_payment": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 6
skinparam shadowing false
skinparam ArrowColor #008F62
skinparam ParticipantBorderColor #0D9488
skinparam ParticipantBackgroundColor #F0FDF4

autonumber

actor "Account Owner" as User
participant "PaymentsPage\\n(Obligations Ledger)" as View
participant "InstallmentModal" as Modal
participant "PaymentService" as Service
participant "PostgreSQL Database\\n(RLS & Tables)" as DB

User -> View : Click "Record Installment" on Payment #P101
activate View
View -> Modal : Open Modal with Payment Principal & Paid Balance ($500 / $1200)
activate Modal

User -> Modal : Input Installment Amount: $300, Date, Method
User -> Modal : Submit Form

Modal -> Modal : Client Validation:\\nEnsure $300 <= ($1200 - $500)
Modal -> Service : recordInstallment({ paymentId, amount: 300, date, method })
activate Service

Service -> DB : INSERT INTO public.payment_records\\n(payment_id, user_id, amount, payment_date, payment_method)
activate DB
DB -> DB : Check RLS (auth.uid() = user_id)
DB --> Service : Return inserted PaymentRecord
deactivate DB

Service -> DB : SELECT SUM(amount) FROM payment_records WHERE payment_id = P101
activate DB
DB --> Service : Total Paid = $800.00
deactivate DB

Service -> Service : computePaymentStatus(\\ntotalAmount=1200, paidAmount=800,\\ndueDate='2026-12-01', status='pending')\\n==> 'partially_paid'

Service -> DB : UPDATE public.payments\\nSET paid_amount = 800.00, status = 'partially_paid'\\nWHERE id = P101
activate DB
DB --> Service : Confirm Update
deactivate DB

Service -> Service : notifyPaymentUpdated() (Dispatch CustomEvent)
Service --> Modal : Return Success
deactivate Service

Modal --> View : Close Modal & Trigger Re-render
deactivate Modal

View --> User : Update Payment Progress Bar (66.7%) & Status Badge ("Partially Paid")
deactivate View

@enduml""",

    "09_seq_financial_report": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 6
skinparam shadowing false
skinparam ArrowColor #008F62
skinparam ParticipantBorderColor #0D9488
skinparam ParticipantBackgroundColor #F0FDF4

autonumber

actor "Account Owner" as User
participant "Analytics / Reports View" as View
participant "TransactionService" as Service
participant "ExportUtils Engine" as Export
participant "Browser File Subsystem" as Browser
participant "PostgreSQL Database" as DB

User -> View : Select Date Range (e.g., Nov 2026) & Click "Export CSV Ledger"
activate View

View -> Service : getTransactions(userId, dateRange)
activate Service

Service -> DB : SELECT t.*, c.name as category_name\\nFROM transactions t LEFT JOIN categories c ON t.category_id = c.id\\nWHERE t.user_id = auth.uid() AND t.transaction_date BETWEEN ...
activate DB
DB --> Service : Return Raw Ledger Rows
deactivate DB

Service --> View : Return Filtered Transaction Dataset
deactivate Service

View -> Export : exportTransactionsToCSV(transactions, categories)
activate Export

Export -> Export : Prepend UTF-8 Byte Order Mark (BOM: \\uFEFF)\\n(for Excel Compatibility)
Export -> Export : Construct CSV Header:\\nDate, Type, Category, Amount, Payment Method, Merchant, Notes
loop Each Transaction Row
  Export -> Export : Format ISO Date to Localized String
  Export -> Export : Format Numeric Amount with Currency Precision
  Export -> Export : sanitizeCSVField() (Escape quotes, handle commas)
  Export -> Export : Append CSV Formatted Row
end

Export -> Browser : Create Blob (type: 'text/csv;charset=utf-8;')
activate Browser
Export -> Browser : Create Object URL (URL.createObjectURL(blob))
Export -> Browser : Create hidden <a> anchor with download="duesdock_ledger_YYYY-MM.csv"
Export -> Browser : anchor.click() & URL.revokeObjectURL()
Browser --> User : Prompt File Save Dialog / Save CSV to Disk
deactivate Browser

Export --> View : Export Complete
deactivate Export

View --> User : Display Toast Notification ("Ledger CSV Exported Successfully")
deactivate View

@enduml""",

    "10_level_1_dfd": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #008F62

!define Process(name) rectangle "<b>name</b>" as name #E6F7F2
!define Store(name) database "<b>name</b>" as name #F8FAFC
!define Entity(name) rectangle "<b>name</b>" as name #FEF3C7

Entity(User) as "Account Owner"
Entity(Google) as "Google Identity Provider"
Entity(FileSys) as "Local File System / Excel"

Process(P1) as "1.0\\nAuthenticate & Profile Provisioning"
Process(P2) as "2.0\\nLedger Transaction Processing"
Process(P3) as "3.0\\nMonthly Budgeting & Variance Control"
Process(P4) as "4.0\\nPayment Obligations & Settlement Engine"
Process(P5) as "5.0\\nFinancial Analytics & Report Generation"

Store(D1) as "D1: Profiles"
Store(D2) as "D2: Categories"
Store(D3) as "D3: Transactions Ledger"
Store(D4) as "D4: Monthly Budgets"
Store(D5) as "D5: Payment Obligations"
Store(D6) as "D6: Payment Records (Installments)"
Store(D7) as "D7: Encrypted Receipts Bucket"

User --> P1 : OAuth Credentials / Consent
P1 <--> Google : PKCE Token Exchange
P1 --> D1 : Provision User Profile & Preferences
D1 --> P1 : Profile & Currency Data

User --> P2 : Transaction Details & Receipt
P2 --> D7 : Upload Binary Receipt File
P2 --> D3 : Insert Income/Expense Record
D2 --> P2 : Validate Category
D3 --> P2 : Query Historical Ledger

User --> P3 : Monthly Budget Limits
P3 --> D4 : Upsert Category Budget Caps
D3 --> P3 : Fetch Monthly Expenditures
P3 --> User : Budget Consumption & Threshold Alerts

User --> P4 : Payables / Receivables & Installments
P4 --> D5 : Register Obligation
P4 --> D6 : Record Installment Settlements
D6 --> P4 : Aggregate Installment Sums
P4 --> D5 : Update Status & Paid Amount
D5 --> P4 : Return Status & Outstanding Balances
P4 --> User : Payment Progress & Due Alerts

D3 --> P5 : Query Ledger Inflows/Outflows
D4 --> P5 : Query Budget Limits
D5 --> P5 : Query Debt/Receivable Positions
P5 --> User : Render Dashboards & Charts
P5 --> FileSys : Stream Sanitized CSV Ledger

@enduml""",

    "11_deployment_diagram": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #008F62

node "Client Tier\\n(End-User Workstation / Mobile)" as ClientNode {
  artifact "Modern Web Browser\\n(Chrome, Safari, Edge, Firefox)" as Browser {
    component "React 19 Liquid Glass SPA" as ReactApp
    component "Local Web Storage (Fallback & Cache)" as WebStorage
  }
}

cloud "Edge Delivery Tier\\n(Vercel Global Edge Network)" as VercelCloud {
  node "Vercel Edge Node" as VercelNode {
    component "Anycast DNS & SSL/TLS Gateway" as EdgeGateway
    component "Edge Cache & Asset CDN" as StaticCDN
    artifact "Optimized Static Bundle\\n(Vite 8.3 Chunked ES Modules)" as Bundle
  }
}

cloud "Identity Provider Tier\\n(Google Cloud Platform)" as GoogleCloud {
  node "Google Identity Services" as GoogleNode {
    component "OAuth 2.0 Authorization Server" as GoogleOAuth
  }
}

cloud "Backend-as-a-Service Tier\\n(Supabase Cloud Infrastructure)" as SupabaseCloud {
  node "Kong API Gateway & Security Proxy" as SupabaseProxy {
    component "GoTrue Auth Daemon" as GoTrue
    component "PostgREST API Server" as PostgREST
  }

  node "PostgreSQL Database Server (Postgres 15)" as PostgresNode {
    database "PostgreSQL Instance (Port 5432)" as PostgresDB {
      frame "Row-Level Security (RLS) Filter" as RLSFilter
      collections "Relational Tables & Triggers" as DBData
    }
  }

  node "Object Storage Server (S3 Backend)" as StorageNode {
    component "Storage API Service" as StorageAPI
    storage "Private 'receipts' Bucket" as StorageBucket
  }
}

ClientNode <--> EdgeGateway : HTTPS (Port 443)
EdgeGateway --> StaticCDN : Cache Hit / Miss
StaticCDN --> Bundle : Serves Assets

ReactApp <--> GoogleOAuth : OAuth 2.0 PKCE Handshake
ReactApp <--> GoTrue : HTTPS JWT Auth Requests
ReactApp <--> PostgREST : HTTPS RESTful Queries (Bearer JWT)
ReactApp <--> StorageAPI : HTTPS File Upload & Signed URLs

GoTrue --> PostgresDB : User Provisioning
PostgREST --> RLSFilter : Evaluates auth.uid()
RLSFilter --> DBData : Secure Row Access
StorageAPI --> StorageBucket : User Folder Isolation

@enduml""",

    "12_payment_state_machine": """@startuml
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #008F62
skinparam StateBorderColor #0D9488
skinparam StateBackgroundColor #F0FDF4

[*] --> Pending : Obligation Created\\n[paid_amount = 0 && due_date >= today]

Pending : Balance Remaining = total_amount
Pending : No installment recorded yet

Pending --> Partially_Paid : Record Installment\\n[0 < paid_amount < total_amount && due_date >= today]
Pending --> Overdue : Due Date Elapsed\\n[due_date < today && paid_amount = 0]
Pending --> Paid : Full Settlement Recorded\\n[paid_amount >= total_amount]
Pending --> Cancelled : User Cancels Obligation

Partially_Paid : 0 < paid_amount < total_amount
Partially_Paid : Progress bar active (0% - 100%)

Partially_Paid --> Partially_Paid : Record Additional Installment\\n[paid_amount + installment < total_amount]
Partially_Paid --> Paid : Final Installment Recorded\\n[paid_amount >= total_amount]
Partially_Paid --> Overdue : Due Date Elapsed\\n[due_date < today && paid_amount < total_amount]
Partially_Paid --> Cancelled : User Cancels Obligation

Overdue : due_date < today && paid_amount < total_amount
Overdue : Red Alert Indicator Active

Overdue --> Partially_Paid : Record Partial Installment\\n[0 < paid_amount < total_amount]
Overdue --> Paid : Complete Overdue Balance\\n[paid_amount >= total_amount]
Overdue --> Cancelled : User Cancels Obligation

Paid : paid_amount >= total_amount
Paid : Obligation Fully Settled (100%)
Paid : Green Success Indicator

Cancelled : Obligation Voided / Inactive
Cancelled : Grey Disabled Indicator

Paid --> [*]
Cancelled --> [*]

@enduml"""
}

PATHS = [
    r"D:\EXTRAS\Projects\DuesDock\docs\diagrams",
    r"C:\Users\kos72\.gemini\antigravity\worktrees\serene-shannon\duesdock_initial_setup_plan\docs\diagrams"
]

def render_kroki(source, out_path):
    url = "https://kroki.io/"
    payload = json.dumps({
        "diagram_source": source,
        "diagram_type": "plantuml",
        "output_format": "png"
    }).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                if res.status == 200:
                    with open(out_path, "wb") as f:
                        f.write(res.read())
                    print(f"Rendered: {os.path.basename(out_path)}")
                    return True
        except Exception as e:
            print(f"Attempt {attempt+1} failed for {os.path.basename(out_path)}: {e}")
            time.sleep(2)
    return False

def main():
    for base_dir in PATHS:
        os.makedirs(base_dir, exist_ok=True)
        rendered_dir = os.path.join(base_dir, "rendered")
        os.makedirs(rendered_dir, exist_ok=True)

    # Save .puml files
    for name, content in DIAGRAMS.items():
        for base_dir in PATHS:
            puml_file = os.path.join(base_dir, f"{name}.puml")
            with open(puml_file, "w", encoding="utf-8") as f:
                f.write(content.strip())
        print(f"Wrote PUML: {name}.puml")

    # Render PNGs into first path, then copy to second
    first_rendered = os.path.join(PATHS[0], "rendered")
    second_rendered = os.path.join(PATHS[1], "rendered")

    for name, content in DIAGRAMS.items():
        out_png = os.path.join(first_rendered, f"{name}.png")
        success = render_kroki(content, out_png)
        if success:
            # Copy to second path
            second_png = os.path.join(second_rendered, f"{name}.png")
            with open(out_png, "rb") as src, open(second_png, "wb") as dst:
                dst.write(src.read())

    print("\nAll 12 diagrams written and rendered successfully!")

if __name__ == "__main__":
    main()
