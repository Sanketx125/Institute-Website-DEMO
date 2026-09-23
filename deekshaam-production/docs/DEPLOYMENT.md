# Deekshaam Production Platform — Deployment & Setup Guide

This guide provides end-to-end instructions for deploying the platform locally for development, in Docker containers, or directly on bare-metal / VPS production environments.

---

## 1. Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **PostgreSQL**: 15 or 16 (or Docker)
- **Git**

---

## 2. Environment Setup

1. Duplicate `.env.example` to `.env` in the repository root:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables in `.env`:
   - `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/deekshaam_production?schema=public`)
   - `JWT_SECRET`: A secure 32+ character random secret string (required in production — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `CLIENT_ORIGIN`: Exact origin of the web app, used as the CORS allow-list (required in production)
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Provided by the finance department (key secret required in production)
   - `RAZORPAY_WEBHOOK_SECRET`: Configured in Razorpay Webhook dashboard (required in production)
   - `ADMIN_PASSWORD` & `STAFF_PASSWORD`: Bootstrap passwords for the super admin and admissions staff accounts (required in production)

   The API refuses to start in production if any of the secrets or bootstrap passwords above are missing. In development, missing secrets are generated randomly per boot and missing account passwords are printed once to the console.

---

## 3. Local Development Run

```bash
# 1. Install dependencies across all monorepo packages
npm install

# 2. Build shared packages (types, validation, ui)
npm run build:packages

# 3. Generate Prisma client and seed database
npm run seed

# 4. Start backend API (Port 5000)
npm run dev:api

# 5. In a separate terminal, start frontend web client (Port 3000)
npm run dev:web
```

Open `http://localhost:3000` in your browser to view the public website.
Open `http://localhost:3000/admin` to access the administration workspace.

### Staff Credentials:
- **Super Admin Email**: `admin@deekshaam.edu`
- **Admissions Staff Email**: `admissions@deekshaam.edu`
- **Passwords**: provided via `ADMIN_PASSWORD` / `STAFF_PASSWORD` (no defaults are shipped)

---

## 4. Docker Deployment

Deploy the entire stack (PostgreSQL, Node.js API, Nginx Web Client, and Storage Volumes) with a single command:

```bash
cd docker
docker-compose up -d --build
```

- Web application: `http://localhost`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## 5. Production Build Verification

```bash
# Build all workspaces
npm run build

# Run automated integration tests
npm test
```
