# AcxiomCRM — Enterprise Role-Based CRM Web Application

A full-stack, enterprise-grade CRM web application built with **Node.js, Express, Sequelize (MySQL), and React (Vite) + Bootstrap 5 + Chart.js**. Designed with robust role-based access control (RBAC), multi-tiered validation, account lockout security, and immutable audit trails.

---

## 🌟 Tech Stack

- **Backend**: Node.js, Express 4, Sequelize ORM (`mysql2`), JWT in `httpOnly` secure cookies, bcryptjs password hashing, `express-validator`, `helmet`, `cors`, `express-rate-limit`.
- **Frontend**: React 18, Vite, React Router v6, Axios (with credentials), Bootstrap 5, Bootstrap Icons, Chart.js (`react-chartjs-2`).
- **Database**: MySQL 8.0 with automatic table schema creation (`sequelize.sync`) and automated seeding.
- **Security**: Account lockout (5 failed attempts locks for 15 minutes), strict password policy, rate-limited login, parameterized queries, centralized error handling (no stack traces or DB details leaked).

---

## 👥 Seeded Login Credentials

| Role | Username | Email | Password | Permissions & Data Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@acxiomcrm.com` | `Admin@12345` | **Full access**: All CRM data, User Management (roles/activation/unlock), and Audit Trail. |
| **Manager** | `manager` | `manager@acxiomcrm.com` | `Manager@12345` | **Organization-wide CRM**: Full customer repository, all deals, pipeline analytics; no user/audit management. |
| **SalesExecutive** | `sales` | `sales@acxiomcrm.com` | `Sales@12345` | **Scoped CRM**: Sees only customer accounts, opportunities, and follow-ups assigned to or created by them. |

> *All passwords comply with the system policy: minimum 8 characters, uppercase, lowercase, digit, and special character.*

---

## 🚀 Quick Setup & Installation

### Prerequisites
- **Node.js** (v18+ recommended)
- **MySQL Server** (v8.0+ running on port 3306)

---

### Step 1: Create MySQL Database
Using the MySQL command-line or MySQL Workbench:
```sql
CREATE DATABASE IF NOT EXISTS acxiom_crm;
```

---

### Step 2: Configure Environment Variables

#### Backend (`/server/.env`):
Create `server/.env` (or copy from `server/.env.example`):
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=super_secret_jwt_key_acxiom_crm_2026_x!@#$
JWT_EXPIRES_IN=24h
COOKIE_EXPIRES_DAYS=1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=acxiom_crm
DB_USER=root
DB_PASSWORD=your_mysql_password
```

#### Frontend (`/client/.env`):
Create `client/.env` (or copy from `client/.env.example`):
```ini
VITE_API_URL=http://localhost:5000/api
```

---

### Step 3: Install Dependencies

#### Server dependencies:
```bash
cd server
npm install
```

#### Client dependencies:
```bash
cd ../client
npm install
```

---

### Step 4: Database Sync & Seeding
The backend server **automatically synchronizes the MySQL tables and seeds the demo data** on its first startup.
You can also run the seed script manually at any time:
```bash
cd server
npm run seed
```
This creates:
- 3 Role Accounts (`Admin`, `Manager`, `SalesExecutive`)
- 10 Sample Customer accounts
- 10 Sample Opportunities across stages (`Qualification`, `Proposal`, `Negotiation`, `Won`, `Lost`)
- 10 Scheduled & completed Follow-ups

---

### Step 5: Start the Application

#### Terminal 1 — Start Backend Server:
```bash
cd server
npm start
```
*Server starts on `http://localhost:5000`.*

#### Terminal 2 — Start Frontend Client:
```bash
cd client
npm run dev
```
*Frontend opens on `http://localhost:5173`.*

---

## 🧪 Automated Test Script

Run the automated end-to-end verification suite from the project root:
```bash
node test_crm.js
```

### Verification Flow Covered:
1. **Unauthenticated access blocked**: `GET /api/customers` and `GET /api/dashboard` return `401 Unauthorized`.
2. **Server-side validation**:
   - Customer invalid email rejects with exact message: `"Enter a valid email address."`
   - Customer invalid phone rejects with exact message: `"Enter a valid phone number."`
3. **Opportunity validation**:
   - Zero/Negative amount rejects with: `"Opportunity Amount must be greater than 0."`
   - Probability > 100 rejects with: `"Probability must be between 0 and 100."`
   - Past close date rejects with: `"Expected Close Date cannot be in the past."`
4. **Follow-up validation**:
   - Past follow-up date rejects with: `"Follow-up date cannot be earlier than today."`
5. **Role-based authorization & data scoping**:
   - `SalesExecutive` is forbidden (403) from accessing `/api/users` and `/api/audit`, and sees only their assigned deals.
   - `Manager` is forbidden (403) from `/api/users` and `/api/audit`, but accesses all organizational CRM records.
   - `Admin` has full access (200) to `/api/users`, `/api/audit`, and all CRM data.
6. **Audit log verification**: Ensures security events (e.g. `LOGIN_SUCCESS`, `ACCOUNT_LOCKOUT`) are written to the append-only audit trail.
7. **JSON responses**: Validates DTO-style responses without sensitive fields.
8. **Dashboard & Charts**: Verifies summary cards and Chart.js datasets for stage distribution and won vs lost ratios.

---

## 📁 Project Structure

```
d:/acxiomCRM/
├── test_crm.js                 # Automated E2E verification test script
├── README.md                   # Complete documentation & setup guide
│
├── server/                     # Backend Node.js / Express application
│   ├── .env                    # Environment configuration (active)
│   ├── .env.example            # Environment configuration template
│   ├── package.json            # Server dependencies and scripts
│   ├── server.js               # Express application entry point & DB sync
│   ├── config/
│   │   └── db.js               # Sequelize MySQL connection pool
│   ├── models/
│   │   ├── index.js            # Model associations and exports
│   │   ├── User.js             # User model (roles, lockout, bcrypt hash)
│   │   ├── Customer.js         # Customer entity (auto CustomerCode)
│   │   ├── Opportunity.js      # Deal entity (stages, amount, probabilities)
│   │   ├── FollowUp.js         # Follow-up entity (call, meeting, demo)
│   │   └── AuditLog.js         # Immutable append-only audit trail
│   ├── middleware/
│   │   ├── auth.js             # JWT verification from httpOnly cookie
│   │   ├── authorize.js        # Role enforcement and data scoping helper
│   │   ├── rateLimiter.js      # Express rate limit for auth endpoints
│   │   ├── validate.js         # express-validator request handler
│   │   └── errorHandler.js     # Safe JSON error response handler
│   ├── controllers/
│   │   ├── authController.js   # Register, Login (lockout logic), Logout, Me
│   │   ├── customerController.js # Scoped CRUD + search + deactivation
│   │   ├── opportunityController.js # Scoped deal pipeline CRUD
│   │   ├── followUpController.js # Scoped follow-ups & completion
│   │   ├── dashboardController.js # Scoped metrics & Chart.js data
│   │   ├── auditController.js  # Filterable audit trail (Admin only)
│   │   └── userController.js   # User management & account unlocking
│   ├── routes/                 # REST API routes
│   └── seed/
│       └── seed.js             # DB schema sync + initial seeding script
│
└── client/                     # Frontend React (Vite) application
    ├── .env                    # Client environment configuration
    ├── .env.example            # Client environment template
    ├── package.json            # Client dependencies and scripts
    ├── vite.config.js          # Vite config with API proxy
    ├── index.html              # HTML shell
    └── src/
        ├── App.jsx             # React Router and protected routing
        ├── main.jsx            # React root mount
        ├── index.css           # Styling with Bootstrap 5 & Icons
        ├── services/
        │   └── api.js          # Axios client with credentials & interceptors
        ├── context/
        │   └── AuthContext.jsx # Authentication state, session check & RBAC
        ├── components/
        │   ├── Navbar.jsx      # Role-based responsive navigation bar
        │   ├── ProtectedRoute.jsx # Route guard with role-based redirection
        │   ├── Pagination.jsx  # Reusable pagination component
        │   ├── ConfirmModal.jsx # Confirmation dialog for actions
        │   └── AlertBanner.jsx # Dismissible feedback alerts
        └── pages/
            ├── Login.jsx       # Login form with quick demo credentials
            ├── Register.jsx    # Registration with password policy checks
            ├── Dashboard.jsx   # Metrics cards & Chart.js visualizations
            ├── Customers.jsx   # Customer directory, search & CRUD
            ├── Opportunities.jsx # Sales pipeline & deal management
            ├── FollowUps.jsx   # Touchpoint scheduling & completion
            ├── AuditLogs.jsx   # Audit viewer with filters (Admin only)
            └── UserManagement.jsx # User roles, activation & unlock (Admin only)
```

---

## 🔒 Security Architecture Highlights

1. **Authentication in `httpOnly` Cookies**:
   JWT tokens are stored in `httpOnly`, `sameSite: 'lax'` cookies to prevent client-side XSS token theft.
2. **Account Lockout Policy**:
   5 consecutive failed login attempts trigger an automatic 15-minute account lockout (`failedLoginCount` and `lockoutEnd` on User model), logged to the audit trail. Admins can unlock users immediately in the User Management UI.
3. **Double-Layer Validation**:
   - **Frontend**: Real-time form validation with inline error messages.
   - **Backend**: Express-validator middleware enforcing matching regex, range, and format rules.
4. **Append-Only Audit Trail**:
   Audit entries (`UserId`, `Action`, `EntityName`, `RecordId`, `OldValue`, `NewValue`, `CreatedDate`, `IpAddress`) are logged automatically without edit or delete endpoints.
5. **Role-Based Authorization & Data Scoping**:
   Server-side middleware dynamically applies Sequelize query scopes:
   - `SalesExecutive`: `WHERE assignedTo = user.id OR createdBy = user.id`.
   - `Manager` & `Admin`: Scoped across all records.
