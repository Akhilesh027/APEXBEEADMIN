# ApexBee Ecosystem Admin Control Center

A high-performance, responsive, and visually stunning Admin Control Panel built for managing the **ApexBee Hyperlocal Multi-Vendor & Partner Ecosystem**. This dashboard serves as the central orchestration deck for territory mappings, multi-level franchise revenue splits, product catalog audits, service providers, courses, travel agents, financial partners, security constraints, and live operations.

---

## 🚀 Tech Stack

The application is engineered using modern front-end technologies:
* **Framework**: React 19 + TypeScript (Strict Mode Enabled)
* **Build Tool**: Vite
* **Styling**: Tailwind CSS v4 (Glassmorphism, curated HSL color systems, custom scrollbars)
* **Animations**: Framer Motion (Smooth page transitions, drawer actions, interactive hover states)
* **Charts**: Recharts (Customized charts reflecting revenue projections, click-through-rates, and order volumes)
* **Icons**: Lucide React (Clean, modern SVG iconography)

---

## 📂 Project Architecture

```
admin-panel/
├── src/
│   ├── components/            # Reusable UI layout elements
│   │   ├── Header.tsx         # Notification tray, profile toggle, global search, dynamic breadcrumbs
│   │   ├── Sidebar.tsx        # Responsive navigation sidebar, grouped menus, theme toggles
│   │   └── MetricCard.tsx     # Reusable animated statistics card with trend indicators
│   ├── context/
│   │   └── AdminStateContext.tsx # Centralized React Context managing state & calculations
│   ├── data/
│   │   └── mockData.ts        # Database schemas, mock states, and datasets
│   ├── pages/                 # Individual dashboards and workflows
│   │   ├── Login.tsx          # Multi-actor secure login gateway
│   │   ├── Dashboard.tsx      # High-level overview, KPIs, logs, and chart widgets
│   │   ├── KycVerification.tsx # Aadhaar/PAN/GST verification workflow
│   │   ├── CategoryManagement.tsx # Product category creation & variant sandbox
│   │   ├── ProductApprovals.tsx   # Catalog pricing, packaging, shipping, and splits config
│   │   ├── CommissionEngine.tsx   # Interactive calculator for multi-tiered payouts
│   │   ├── PaymentVerification.tsx # Manual receipt/transaction verification panel
│   │   ├── OrderManagement.tsx    # Order trackers, delivery details, and return simulators
│   │   ├── DeliveryManagement.tsx # Logistics dispatch controller (Platform vs Vendor vs Courier)
│   │   ├── WalletManagement.tsx   # Ledger audits and vendor/franchise payouts clearances
│   │   ├── ReportsAnalytics.tsx   # Monthly trade volumes and spreadsheet export simulator
│   │   ├── CouponManagement.tsx   # Promo discount configurations (rupee & percentage margins)
│   │   ├── TerritoryManagement.tsx # State/District/Mandal coordinates & interactive coverage Heat Map
│   │   ├── EcosystemMap.tsx       # Hierarchy map tree visualizer for franchises
│   │   ├── ApprovalCenter.tsx     # Consolidated workspace for pending items
│   │   ├── SupplyChainHub.tsx     # Wholesaler directory, procurement, and PO audits
│   │   ├── CommissionControlCenter.tsx # Platform margin rate parameters configurator
│   │   ├── SettlementCenter.tsx   # Batch withdrawals processor
│   │   ├── CommunicationCenter.tsx # Broadcasting channels (SMS, Push, WhatsApp, Broadcasts)
│   │   ├── BusinessIntelligence.tsx # Projections and leaderboards
│   │   ├── HyperlocalOperations.tsx # Live mapping analytics and coverage gap graphs
│   │   ├── FinancialCenter.tsx    # Real-time GMV counters and spreads analyzer
│   │   ├── RiskCenter.tsx         # Fraud patterns tracker and account lockouts
│   │   ├── QrNetwork.tsx          # Merchant scanner and checkout simulator
│   │   ├── FranchiseMarketplace.tsx # Franchise leads CRM Kanban board
│   │   ├── UserManagement.tsx     # User directories, referral trees, and active logs
│   │   ├── VendorManagement.tsx   # Enhanced vendor directory, KYC status, and ratings
│   │   ├── WholesalerManagement.tsx # Wholesalers profiles, procurement volume tracker
│   │   ├── EntrepreneurManagement.tsx # Entrepreneur listings, training milestones, success stories
│   │   ├── CourseProviderManagement.tsx # Digital academy course approvals, instructor listings
│   │   ├── ServiceProviderManagement.tsx # Hyperlocal home service bookings (Plumbers, Electricians)
│   │   ├── PosSoftwarePartners.tsx # SaaS billing app subscriptions, active registers
│   │   ├── FinancialServicesPartners.tsx # Lead pipelines for loans, insurance, GST consultants
│   │   ├── TravelPartnerManagement.tsx # Tour packages, agents, and hotel partner listings
│   │   ├── AdvertisementManagement.tsx # Banner slots, sponsored ads, CTR monitors
│   │   ├── TrainingManagement.tsx # Video courses library, training programs, certifications
│   │   ├── StaffManagement.tsx    # Operations, finance, support team roster & RBAC permissions
│   │   ├── AuditLogs.tsx          # Complete security actions ledger, search & filters
│   │   ├── SupportCenter.tsx      # SLA metrics, multi-party tickets, escalation control
│   │   └── SecuritySettings.tsx   # Two-Factor (MFA) setup, IP Whitelists, login limits
│   ├── App.tsx                # Routing, active navigation controller, and page layout wrapper
│   ├── index.css              # Styling configurations, variables, scrollbar rules
│   └── main.tsx               # Entry point
```

---

## 🛠 Features & Workflows Guide

### 🧑💼 1. Authentication & Security
* **Access Control**: Features a multi-role login interface (`Login.tsx`). Enter credentials (`admin@apexbee.com`/`admin123`) to unlock the full ecosystem.
* **Security Controls** (`SecuritySettings.tsx`): 
  - Manage two-factor authentication keys (TOTP).
  - Configure IP whitelists to restrict administrative access.
  - Track failed login counts and active logins from different devices.

### 👥 2. User & Referral Management
* **User Directory** (`UserManagement.tsx`): Filters users by category (Guests, Customers, Business Partners). Shows registrations, active locations, and wallet balances.
* **Referral Tree**: Visualizes multi-tier referral streams (L1, L2, L3) with active balance monitoring.

### 🏪 3. Vendor & Wholesaler Management
* **KYC Approvals** (`KycVerification.tsx`): Standardizes checking of legal documentation (Aadhaar, PAN, GSTIN).
* **Vendor Operations** (`VendorManagement.tsx`): Shows active, pending, or rejected vendors. Tracks performance, ratings, and revenue contributions.
* **Wholesaler Supply Chain** (`WholesalerManagement.tsx` & `SupplyChainHub.tsx`): Manages bulk suppliers. Tracks procurement quotes, lets you create purchase orders, and inspects supplier ratings.

### 📦 4. Product Catalog & Custom Commissions splits
* **Product Auditing** (`ProductApprovals.tsx`): Allows you to verify seller uploads. Administrators can configure:
  - Base pricing, shipping, and packaging costs.
  - Multi-tier franchise margins (separate shares for State, District, and Mandal franchises).
  - Referral program splits (L1, L2, and L3 percentages).
* **Deficit Warnings**: The commission engine warns administrators if configuration values exceed total fees, helping prevent platform deficits.
* **Category Sandbox** (`CategoryManagement.tsx`): Supports category creation with custom attributes (such as Size, Color, Weight, Material) and includes a test tool to preview dynamic variant combinations.

### 💸 5. Financial Orchestration
* **Interactive Commission Engine** (`CommissionEngine.tsx`): Simulates pricing setups. Calculates splits for packing, shipping, L1-L3 referrals, and franchise shares.
* **Settlements** (`SettlementCenter.tsx` & `WalletManagement.tsx`):
  - Review transaction logs and approve merchant withdrawal requests.
  - Batch payouts release funds directly to verified seller UPI coordinates.
* **Manual Payments** (`PaymentVerification.tsx`): A manual ledger to audit user-submitted UPI screenshots and match transaction numbers to verify pending orders.

### 🗺 6. Territory & Ecosystem Mapping
* **Territory Coverage** (`TerritoryManagement.tsx`): Tracks franchise coverage across States, Districts, Mandals, and Pincodes. Includes a color-coded coverage heat map.
* **Network Visualization** (`EcosystemMap.tsx`): Visualizes the hierarchical relationships from State Franchise down to customers.
* **Franchise CRM** (`FranchiseMarketplace.tsx`): A CRM board to track prospective franchise applications through stages: Leads ➜ Applied ➜ Screening ➜ Onboarded.

### 🎓 7. Training & Course Academy
* **Academy Management** (`CourseProviderManagement.tsx`): Coordinates educational content approvals, instructor assignments, student enrollments, and revenue share splits.
* **Training Program Tracker** (`TrainingManagement.tsx` & `EntrepreneurManagement.tsx`): Monitors completion rates for mandatory merchant training modules.

### 🔧 8. Services, Software, POS, & Advertising
* **Service Bookings** (`ServiceProviderManagement.tsx`): Tracks bookings, assignments, and payouts for service providers like electricians, plumbers, and technicians.
* **POS Partners** (`PosSoftwarePartners.tsx` & `FinancialServicesPartners.tsx`):
  - Manage billing applications and subscriptions.
  - Track leads for partner services like loans, shop insurance, and GST consulting.
* **Ad Placements** (`AdvertisementManagement.tsx`): Controls homepage banner spaces and sponsored listings. Displays click-through-rate (CTR) performance and earnings.

### 📊 9. Communications, BI, Operations & Logs
* **Broadcasting** (`CommunicationCenter.tsx`): Send push alerts, SMS, or WhatsApp notifications to targeted groups (e.g., all Mandal franchises or active customers).
* **Audit Logs** (`AuditLogs.tsx`): A centralized activity feed of administrative actions, logins, and wallet updates, with CSV export capabilities.
* **Customer Support** (`SupportCenter.tsx`): Monitors SLA levels, categorizes open tickets, and handles escalations.

---

## 🏃 Testing & Run Locally

Follow these steps to run the ApexBee Admin Panel on your local machine:

### 1. Installation
Clone or navigate to the project directory and install the required packages:
```powershell
cd C:\Users\akhil\.gemini\antigravity\scratch\admin-panel
npm install
```

### 2. Run the Development Server
Launch the local Vite server:
```powershell
npm run dev
```
Open your browser and navigate to the local URL (usually `http://localhost:5173`).

### 3. Build & Compile Checks
To verify TypeScript compilation and build output:
```powershell
npm run build
```
The build output will be compiled into the `dist` directory, ready for production deployment.
#   A P E X B E E F R O N T E N D  
 