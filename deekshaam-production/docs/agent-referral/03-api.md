# Referral & Promo Code System API Specification

This document details all REST API endpoints for public visitors, affiliate partners, and administrative staff.

All requests accept and return `application/json` (unless specifying file downloads like CSV). All financial amounts in responses are documented in both standard currency units (INR) and internal minor units (Paise).

---

## 1. Public Endpoints

### 1.1 Validate Promo Code
Validates a partner promo code and returns discount calculation for the selected program.
- **Method**: `POST`
- **Route**: `/api/referral/validate`
- **Auth**: None (Public)
- **Rate Limit**: 10 requests / minute per IP

#### Request Body
```json
{
  "code": "PD10",
  "programSlug": "bba"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "PD10",
    "discountPercent": 10,
    "discountAmount": 50,
    "originalFee": 500,
    "finalFee": 450,
    "message": "Code PD10 applied: 10% off"
  }
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PROMO_CODE",
    "message": "This code is not valid."
  }
}
```
*(Note: Neutral error response is returned whether the code is non-existent, inactive, or malformed).*

---

### 1.2 Submit Online Application (Referral Integration)
Standard admission submission endpoint with optional partner promo code.
- **Method**: `POST`
- **Route**: `/api/admissions/apply`
- **Auth**: None (Public)

#### Request Body
```json
{
  "fullName": "Rohan Sharma",
  "email": "rohan.sharma@example.com",
  "phone": "9811223344",
  "dob": "2004-08-20",
  "gender": "MALE",
  "state": "Karnataka",
  "city": "Bengaluru",
  "programSlug": "bba",
  "board10": "CBSE",
  "year10": "2020",
  "board12": "CBSE",
  "year12": "2022",
  "stream": "COMMERCE",
  "percentage": "84",
  "promoCode": "PD10"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "DBS-2026-894712",
    "fullName": "Rohan Sharma",
    "email": "rohan.sharma@example.com",
    "programSlug": "bba",
    "status": "SUBMITTED",
    "stage": 1,
    "submittedAt": "2026-10-06T15:20:00.000Z",
    "accessToken": "4a7e9f3b2c1d0a5e8f...",
    "agentId": "agent-1791280000000",
    "promoCodeUsed": "PD10",
    "discountPercentApplied": 10,
    "discountAmount": 50,
    "finalFee": 450
  }
}
```

#### Self-Referral Fraud Rejection (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "SELF_REFERRAL_NOT_ALLOWED",
    "message": "This code is not eligible for this applicant."
  }
}
```

---

## 2. Partner / Agent Portal Endpoints

Protected routes requiring `Authorization: Bearer <JWT>` with role `AGENT`.

### 2.1 Get Agent Dashboard
Returns affiliate KPI totals, active rates, shareable link, and masked recent admissions.
- **Method**: `GET`
- **Route**: `/api/referral/agent/dashboard`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "agent-1791280000000",
      "name": "Prashant Dhavan",
      "email": "prashant@agency.com",
      "phone": "9876543210",
      "status": "ACTIVE",
      "promoCode": "PD10",
      "commissionPercent": 15,
      "studentDiscountPercent": 10,
      "isConfigured": true,
      "shareUrl": "https://deekshaam.edu/apply?ref=PD10"
    },
    "metrics": {
      "totalAdmissions": 12,
      "totalPendingCommissionINR": 135.0,
      "totalApprovedCommissionINR": 405.0,
      "totalPaidCommissionINR": 675.0,
      "totalReversedCommissionINR": 0.0
    },
    "recentAdmissions": [
      {
        "id": "DBS-2026-894712",
        "studentName": "Rohan S.",
        "maskedPhone": "98****44",
        "maskedEmail": "r****a@example.com",
        "programSlug": "bba",
        "admissionStatus": "ACCEPTED",
        "grossFeeINR": 500,
        "discountINR": 50,
        "finalFeeINR": 450,
        "commissionINR": 67.5,
        "commissionStatus": "APPROVED",
        "submittedAt": "2026-10-06T15:20:00.000Z"
      }
    ]
  }
}
```

### 2.2 Get Referred Admissions (Paginated)
- **Method**: `GET`
- **Route**: `/api/referral/agent/admissions?status=ACCEPTED&search=Rohan`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "DBS-2026-894712",
      "studentName": "Rohan S.",
      "maskedPhone": "98****44",
      "maskedEmail": "r****a@example.com",
      "programSlug": "bba",
      "admissionStatus": "ACCEPTED",
      "finalFeeINR": 450,
      "commissionINR": 67.5,
      "commissionStatus": "APPROVED",
      "submittedAt": "2026-10-06T15:20:00.000Z"
    }
  ]
}
```

### 2.3 Get Payout History
- **Method**: `GET`
- **Route**: `/api/referral/agent/payouts`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "payo-1791280800000-abc123",
      "totalAmountINR": 67.5,
      "method": "UPI",
      "reference": "UPI-TXN-REF-789123",
      "paidAt": "2026-10-06T15:25:00.000Z",
      "note": "October commission payout"
    }
  ]
}
```

### 2.4 Update Payout Details
- **Method**: `PATCH`
- **Route**: `/api/referral/agent/payout-details`

#### Request Body
```json
{
  "payoutDetails": "Bank: HDFC Bank\nA/C: 50100234567890\nIFSC: HDFC0000123\nHolder: Prashant Dhavan"
}
```

---

## 3. Administrative Endpoints

Protected routes requiring `Authorization: Bearer <JWT>`.
- `SUPER_ADMIN`: Full access to all endpoints below.
- `ADMISSION_STAFF`: Read and create agents with locked 0% rates; cannot view or edit financial rates or record payouts.

### 3.1 List All Agents
- **Method**: `GET`
- **Route**: `/api/referral/agents?search=Prashant&status=ACTIVE`

### 3.2 Create Agent Account
- **Method**: `POST`
- **Route**: `/api/referral/agents`

#### Request Body (Super Admin)
```json
{
  "name": "Prashant Dhavan",
  "email": "prashant@agency.com",
  "phone": "9876543210",
  "commissionPercent": 15,
  "studentDiscountPercent": 10,
  "promoCode": "PD10",
  "payoutDetails": "UPI: prashant@upi",
  "notes": "Affiliate partner onboarded Q4"
}
```

### 3.3 Toggle Agent Active Status
- **Method**: `PATCH`
- **Route**: `/api/referral/agents/:id/status`

### 3.4 List Commissions Ledger
- **Method**: `GET`
- **Route**: `/api/referral/commissions?status=APPROVED&agentId=agent-123`

### 3.5 Record Partner Payout
- **Method**: `POST`
- **Route**: `/api/referral/payouts`

#### Request Body
```json
{
  "agentId": "agent-1791280000000",
  "commissionIds": ["comm-1001", "comm-1002"],
  "method": "BANK_TRANSFER",
  "reference": "UTR8947219842",
  "note": "Quarterly settlement"
}
```

### 3.6 Export Commissions to CSV
- **Method**: `GET`
- **Route**: `/api/referral/commissions/export`
- **Response**: `Content-Type: text/csv` attachment.

### 3.7 Get / Update Referral Policies
- **Method**: `GET` / `PUT`
- **Route**: `/api/referral/settings`

#### Request Body (`PUT`)
```json
{
  "defaultCommissionPercent": 10,
  "defaultDiscountPercent": 10,
  "commissionBase": "NET_FEE",
  "maxAllowedDiscountPercent": 50,
  "maxAllowedCommissionPercent": 50,
  "isEnabled": true
}
```
