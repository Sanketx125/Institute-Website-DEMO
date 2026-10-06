# Referral & Promo Code System Operations Runbook

This guide contains end-to-end operational procedures for DevOps, campus admissions administrators, and finance personnel managing the affiliate partner program.

---

## 1. Feature Flag Configuration & Emergency Killswitch

The entire referral engine is gated behind the environment variable `AGENT_REFERRAL_ENABLED` and the dynamic database setting `ReferralSettings.isEnabled`.

### 1.1 Enabling in Production (.env)
```bash
# Set in /apps/api/.env or production container environment
AGENT_REFERRAL_ENABLED=true
```

### 1.2 Instant Emergency Killswitch
If suspected abuse, fraudulent activity, or accounting discrepancy occurs:
1. **Via Admin Dashboard**: Navigate to **Administration $\to$ Referral Settings** and uncheck **"Enable Referral & Promo Code System"**, then click **Save Referral Policies**.
2. **Via Shell / Environment**:
   ```bash
   export AGENT_REFERRAL_ENABLED=false
   # Restart API container or PM2 process
   pm2 restart deekshaam-api
   ```
*Instant impact*:
- Public admissions form immediately hides the promo code input.
- All `/api/referral/validate` calls immediately return `FEATURE_DISABLED` (400).
- Standard admissions continue executing without disruption at regular full tuition fees.

---

## 2. Onboarding New Affiliate Partners

### Step 1: Partner Information Intake
Obtain from partner:
- Full legal name
- Primary official email address
- Mobile number (10-digit Indian standard)
- Preferred payout details (Bank NEFT details or UPI ID)

### Step 2: Account Creation
1. Sign in to Campus Workspace as **Administrator (`SUPER_ADMIN`)** or **Admissions Staff (`ADMISSION_STAFF`)**.
2. Select **Administration $\to$ Referral Agents**.
3. Click **Create New Agent**:
   - Provide Full Name, Email, and Mobile Number.
   - If Super Admin: Set **Student Discount %** (e.g. `10%`) and **Commission Rate %** (e.g. `15%`). You may specify a custom promo code (e.g. `DIWALI10`) or leave blank for automatic generation (`PD10`).
   - If Admissions Staff: Percentage fields are automatically locked at 0%. The agent will be marked with a "Commission not configured" badge until reviewed by Super Admin.
4. Click **Create Agent**.
5. Note the temporary credentials and generated share link (`https://deekshaam.edu/apply?ref=PD10`). Share the credentials with the partner through encrypted institutional communication channels.

---

## 3. Financial Settlement & Payout Processing

Disbursements should follow the institutional finance cycle (e.g. bi-weekly or monthly).

### Step 1: Reconciliation of Approved Commissions
1. Sign in as **Administrator (`SUPER_ADMIN`)**.
2. Navigate to **Administration $\to$ Commissions & Payouts**.
3. Select status filter: **"Approved (Ready for Payout)"**.
4. Click **Export CSV** to download the line-item audit trail.
5. Provide the CSV to institutional banking/accounts for NEFT or UPI batch transfer.

### Step 2: Recording Payout in Ledger
1. Click **Record Partner Payout**.
2. Select the Partner Agent from the dropdown. The modal automatically displays the total payable balance and the number of eligible approved admissions.
3. Select the payment method (`Bank Transfer` or `UPI Transfer`).
4. Enter the bank transaction reference / UTR number (e.g., `UTR9847192847`).
5. Click **Confirm & Mark Paid**.
*Ledger Effect*: All associated approved commission records immediately transition to `PAID` with immutable linkage to the new `AgentPayout` entry. The partner's dashboard reflects the payment within seconds.

---

## 4. Handling Cancellations, Rejections, and Refunds

- **Application Rejection**: When an applicant's documents fail verification or the candidate is rejected, Admissions Staff marks the application as `REJECTED`. The system automatically catches this event and flips the associated commission to `REVERSED` with reason `"Application rejected"`.
- **Student Withdrawal / Fee Refund**: If a student cancels enrollment after fee payment, Super Admin marks the payment as refunded. The commission transitions to `REVERSED`. If commission was already disbursed (`PAID`), the system logs a chargeback note on the partner's account to be offset against future disbursements.

---

## 5. Database Migration & Rollback Runbook

### Applying Migrations (PostgreSQL Production)
```bash
cd database
npx prisma migrate deploy
```

### Manual SQL Migration
Execute `database/migrations/20261006_add_agent_referral/migration.sql`:
```bash
psql -U $DB_USER -d $DB_NAME -f database/migrations/20261006_add_agent_referral/migration.sql
```

### Safe Reversible Rollback (Down Migration)
Execute `database/migrations/20261006_add_agent_referral/down.sql`:
```bash
psql -U $DB_USER -d $DB_NAME -f database/migrations/20261006_add_agent_referral/down.sql
```
*Note*: Nullable columns on `admissions` table are cleanly dropped without affecting existing rows or breaking data integrity.
