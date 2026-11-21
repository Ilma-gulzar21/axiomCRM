# AcxiomCRM Backend Server

Node.js + Express + Sequelize (MySQL) REST API for the AcxiomCRM system.

## Features
- **Authentication**: JWT stored in `httpOnly` secure cookies.
- **Account Lockout**: 5 failed login attempts locks account for 15 minutes.
- **Role Scoping**: Dynamic SQL query scopes for `SalesExecutive`, `Manager`, and `Admin`.
- **Validation**: `express-validator` enforcing strict rules.
- **Security**: `helmet`, `cors`, `express-rate-limit`, parameterized queries.
- **Audit Logging**: Immutable audit trail for compliance.

## Environment Variables (`.env`)
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
COOKIE_EXPIRES_DAYS=1

DB_HOST=localhost
DB_PORT=3306
DB_NAME=acxiom_crm
DB_USER=root
DB_PASSWORD=your_password
```

## Available Scripts
- `npm start` - Starts the backend server on port 5000 (auto-syncs schema and seeds database on first run).
- `npm run seed` - Manually triggers the database seeder.
