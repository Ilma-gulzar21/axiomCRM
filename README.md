# 💼 AcxiomCRM — Enterprise Role-Based CRM Web Application

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-black.svg?logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-purple.svg?logo=vite)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg?logo=mysql)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7.svg?logo=sequelize)](https://sequelize.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple.svg?logo=bootstrap)](https://getbootstrap.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384.svg?logo=chart.js)](https://www.chartjs.org/)

An enterprise-ready, full-stack Customer Relationship Management (CRM) web application designed with **Multi-Role Access Control (RBAC)**, multi-layered data validation, account lockout security, immutable audit logging, and dynamic pipeline analytics.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Role-Based Access Matrix](#-role-based-access-matrix)
- [Seeded Credentials](#-seeded-credentials)
- [Quick Start Guide](#-quick-start-guide)
- [API Reference](#-api-reference)
- [Validation & Security Architecture](#-validation--security-architecture)
- [Automated Testing Suite](#-automated-testing-suite)
- [Directory Structure](#-directory-structure)

---

## 🏛️ Architecture Overview

```
                      +-----------------------------+
                      |    Browser Client (Vite)    |
                      |   React 18 + Bootstrap 5    |
                      |   Chart.js / Axios Client   |
                      +--------------+--------------+
                                     |
                       httpOnly JWT  |  REST API Calls
                                     v
                      +-----------------------------+
                      |     Node.js / Express       |
                      |  Helmet + CORS + RateLimit  |
                      |  Auth & Role Scope Filters  |
                      |  Express-Validator Rules    |
                      +--------------+--------------+
                                     |
                       Parameterized |  Sequelize ORM
                                     v
                      +-----------------------------+
                      |       MySQL Database        |
                      |  Users, Customers, Deals,   |
                      |  FollowUps, Immutable Audit |
                      +-----------------------------+
```

---

## ✨ Key Features

1. **Enterprise Security & Auth**:
   - JWT tokens stored securely inside `httpOnly` cookies with `sameSite: 'lax'`.
   - **Account Lockout Protection**: 5 failed login attempts automatically trigger a 15-minute security lockout (`failedLoginCount`, `lockoutEnd`).
   - Admins can review locked accounts and unlock them with a single click.
   - Brute-force rate limiting on `/api/auth/login`.
   - Strong password policy: 8+ chars with uppercase, lowercase, digit, and special symbol.

2. **Customer Repository**:
   - Sequential auto-generated customer codes (`CUST-1001`+).
   - Instant search across customer name, email, phone, company, and code.
   - Soft deletion (deactivation sets status to `Inactive`).
   - Duplicate prevention on email and 10-digit phone numbers with `409 Conflict`.

3. **Deal Pipeline & Opportunities**:
   - 5-stage sales cycle: `Qualification`, `Proposal`, `Negotiation`, `Won`, `Lost`.
   - Progress bar probability tracking (0–100%).
   - Rules: Amount > 0, probability between 0 and 100, expected close date cannot be in the past.

4. **Customer Follow-Ups**:
   - Touchpoints: `Call`, `Email`, `Meeting`, `Demo`.
   - Status tracking: `Planned`, `Completed`, `Missed`, `Cancelled`.
   - Quick one-click "Complete" action with outcome notes.
   - Future scheduling validation: date cannot be earlier than today.

5. **Analytics Dashboard**:
   - Key metric cards: Total Customers, Open Deals, Won Deals, Lost Deals, Total Pipeline Value ($), Pending Follow-Ups.
   - Interactive Chart.js charts: **Opportunities by Stage** (Bar Chart) and **Won vs Lost Ratio** (Doughnut Chart).
   - Scoped dynamically based on authenticated user's role.

6. **Append-Only Audit Log (Admin Only)**:
   - Immutable security trail recording actor, action, target entity, record ID, old values, new values, timestamp, and IP.
   - Rich filter bar by user, action, entity, and date range with JSON payload inspector.

---

## 👥 Role-Based Access Matrix

| Feature / Resource | SalesExecutive | Manager | Admin |
| :--- | :---: | :---: | :---: |
| **Login / Logout / Auth** | ✅ | ✅ | ✅ |
| **Dashboard** | ✅ (Scoped to assigned) | ✅ (All accounts) | ✅ (All accounts) |
| **Customer Accounts** | ✅ (Assigned/Created only) | ✅ (All customers) | ✅ (All customers) |
| **Opportunities / Deals** | ✅ (Assigned/Created only) | ✅ (All deals) | ✅ (All deals) |
| **Follow-Ups** | ✅ (Assigned/Created only) | ✅ (All follow-ups) | ✅ (All follow-ups) |
| **User Management** | ❌ (Blocked 403) | ❌ (Blocked 403) | ✅ (Full permissions) |
| **Audit Logs** | ❌ (Blocked 403) | ❌ (Blocked 403) | ✅ (Full permissions) |

---

## 🔑 Seeded Credentials

The database auto-seeds these 3 accounts on first startup:

| Role | Username | Email | Password | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@acxiomcrm.com` | `Admin@12345` | Full system access |
| **Manager** | `manager` | `manager@acxiomcrm.com` | `Manager@12345` | Org-wide CRM pipeline |
| **SalesExecutive** | `sales` | `sales@acxiomcrm.com` | `Sales@12345` | Scoped to assigned records |

> *The login screen includes one-click demo credentials buttons for convenience.*

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (v8.0+ running on port 3306)

### 1. Database Creation
In MySQL:
```sql
CREATE DATABASE IF NOT EXISTS acxiom_crm;
```

### 2. Configure Environment

**Backend (`server/.env`):**
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=super_secret_jwt_key_acxiom_crm_2026_x!@#$
JWT_EXPIRES_IN=24h
COOKIE_EXPIRES_DAYS=1

DB_HOST=localhost
DB_PORT=3306
DB_NAME=acxiom_crm
DB_USER=root
DB_PASSWORD=your_mysql_password
```

**Frontend (`client/.env`):**
```ini
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies
```bash
# Server packages
cd server
npm install

# Client packages
cd ../client
npm install
```

### 4. Run the Application

**Terminal 1 (Backend API):**
```bash
cd server
npm start
```
*(Runs on `http://localhost:5000`)*

**Terminal 2 (Frontend UI):**
```bash
cd client
npm run dev
```
*(Opens on `http://localhost:5173`)*

---

## 📡 API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create new account (Rate-limited, password validation)
- `POST /api/auth/login` — Sign in (Rate-limited, 5-attempt lockout, sets httpOnly cookie)
- `POST /api/auth/logout` — Invalidate session and clear cookie
- `GET /api/auth/me` — Get current logged-in user session

### Customers (`/api/customers`)
- `GET /api/customers` — List customers (pagination, search, role-scoped)
- `GET /api/customers/:id` — Get customer details
- `POST /api/customers` — Create customer account
- `PUT /api/customers/:id` — Update customer account
- `DELETE /api/customers/:id` — Deactivate customer account (Soft delete)

### Opportunities (`/api/opportunities`)
- `GET /api/opportunities` — List deals (stage filter, search, role-scoped)
- `GET /api/opportunities/:id` — Get opportunity details
- `POST /api/opportunities` — Create new deal
- `PUT /api/opportunities/:id` — Update deal / advance stage
- `DELETE /api/opportunities/:id` — Delete deal

### Follow-Ups (`/api/followups`)
- `GET /api/followups` — List follow-ups (status & type filters)
- `POST /api/followups` — Schedule touchpoint
- `PUT /api/followups/:id` — Reschedule / update touchpoint
- `PUT /api/followups/:id/complete` — Mark follow-up as Completed
- `DELETE /api/followups/:id` — Remove follow-up

### Dashboard Metrics (`/api/dashboard`)
- `GET /api/dashboard` — Get metric cards and Chart.js datasets scoped by role

### Administration (Admin Only)
- `GET /api/users` — List users with lockout status
- `PUT /api/users/:id/role` — Update user role (audited)
- `PUT /api/users/:id/status` — Toggle user activation (audited)
- `PUT /api/users/:id/unlock` — Reset failed logins & unlock account
- `GET /api/audit` — Filterable immutable audit trail

---

## 🛡️ Validation & Security Architecture

Both frontend and backend enforce identical rules:

| Field / Rule | Exact Error Message |
| :--- | :--- |
| **Customer Email** | `"Enter a valid email address."` |
| **Customer Phone** | `"Enter a valid phone number."` (10 digits) |
| **Opportunity Amount** | `"Opportunity Amount must be greater than 0."` |
| **Deal Probability** | `"Probability must be between 0 and 100."` |
| **Expected Close Date** | `"Expected Close Date cannot be in the past."` |
| **Follow-Up Date** | `"Follow-up date cannot be earlier than today."` |

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive verification script that validates the full system flow:
```bash
npm test
```
or directly:
```bash
node test_crm.js
```

### Verified Scenarios:
- ✅ **Unauthenticated access blocked** with status 401
- ✅ **Invalid customer rejected** on client and server with exact validation messages
- ✅ **Bad opportunity rejected** (Amount <= 0, Probability > 100, Past date)
- ✅ **Bad follow-up rejected** (Past date)
- ✅ **SalesExecutive access** scoped to assigned records and blocked (403) from Admin APIs
- ✅ **Manager access** scoped to all CRM records and blocked (403) from Admin APIs
- ✅ **Admin access** granted to all records, user management, and audit logs
- ✅ **Audit trail entries** recorded and retrieved correctly
- ✅ **JSON formatting** DTO compliance without exposing passwords or hashes
- ✅ **Dashboard datasets** formatted for Chart.js bar and doughnut visualizations

---

## 📂 Directory Structure

```
acxiomCRM/
├── test_crm.js                 # Automated E2E verification test script
├── package.json                # Project root scripts
├── README.md                   # Complete application guide
├── .gitignore                  # Git ignore rules (node_modules, .env)
│
├── server/                     # Backend Node.js / Express API
│   ├── config/db.js            # Sequelize MySQL connection
│   ├── controllers/            # Request handlers
│   ├── middleware/             # Auth, RBAC, Rate-limit, Validator
│   ├── models/                 # Sequelize entities & associations
│   ├── routes/                 # Express REST endpoints
│   ├── seed/seed.js            # Schema sync and initial seeder
│   ├── services/               # Audit service helper
│   ├── .env.example            # Environment variables template
│   ├── server.js               # Express application entry
│   └── package.json
│
└── client/                     # Frontend React (Vite) Single Page App
    ├── src/
    │   ├── components/         # Navbar, ProtectedRoute, Pagination, Modals
    │   ├── context/            # AuthContext provider
    │   ├── pages/              # Dashboard, Customers, Deals, Audit, Users
    │   ├── services/api.js     # Axios client with credentials
    │   ├── App.jsx             # React Router structure
    │   ├── main.jsx            # React root mount
    │   └── index.css           # Bootstrap styling
    ├── .env.example            # Client env template
    ├── vite.config.js          # Vite config & API proxy
    ├── index.html
    └── package.json
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
