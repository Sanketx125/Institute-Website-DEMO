// Deekshaam Production Platform - Referral & Promo Code Automated Test Suite
const fs = require('fs');

// Monkeypatch fs.realpathSync for Windows sandbox drive mapping
const origSync = fs.realpathSync;
fs.realpathSync = function(p, opts) {
  if (typeof p === 'string' && (p === 'Z:\\' || p === 'Z:' || p === 'z:\\' || p === 'z:')) return p;
  try { return origSync(p, opts); } catch (e) { if (e && e.code === 'EPERM') return p; throw e; }
};
fs.realpathSync.native = fs.realpathSync;

process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-jwt-secret-not-for-production-use';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'integration-test-razorpay-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'integration-test-razorpay-webhook-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
process.env.STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Staff@123456';
process.env.AGENT_REFERRAL_ENABLED = 'true';

const crypto = require('crypto');
const { app } = require('../apps/api/dist/apps/api/src/app.js');

const PORT = 5056;
let server;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text), text };
  } catch {
    return { status: res.status, data: null, text };
  }
}

function razorpaySignature(orderId, paymentId) {
  return crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

async function runReferralTestSuite() {
  console.log('====================================================');
  console.log('DEEKSHAAM REFERRAL SYSTEM - TEST SUITE');
  console.log('====================================================');

  server = app.listen(PORT);
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Super Admin and Staff
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@deekshaam.edu', password: process.env.ADMIN_PASSWORD }),
    });
    const adminToken = adminLogin.data.data.token;
    assert(adminLogin.status === 200 && Boolean(adminToken), 'Super admin authenticated successfully');

    const staffLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admissions@deekshaam.edu', password: process.env.STAFF_PASSWORD }),
    });
    const staffToken = staffLogin.data.data.token;
    assert(staffLogin.status === 200 && Boolean(staffToken), 'Admissions staff authenticated successfully');

    // 2. Promo Code Generation & Agent Creation (Super Admin)
    const createAgentRes = await request('/api/referral/agents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Prashant Dhavan',
        email: 'prashant.dhavan@testagency.com',
        phone: '9876543210',
        commissionPercent: 15,
        studentDiscountPercent: 10,
        payoutDetails: 'UPI: prashant@upi',
        notes: 'Top affiliate partner',
      }),
    });
    assert(createAgentRes.status === 201 && createAgentRes.data.data.promoCode.startsWith('PD10'), 'Agent created by Super Admin with code format PD10');
    const agentPromoCode = createAgentRes.data.data.promoCode;
    const agentId = createAgentRes.data.data.id;
    const agentInitialPassword = createAgentRes.data.data.initialPassword;

    // 3. Staff Agent Creation Rate Lockdown (Defaults to 0% and isConfigured=false)
    const staffCreateAgent = await request('/api/referral/agents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        name: 'Kavita Verma',
        email: 'kavita.verma@consultancy.com',
        phone: '9123456780',
        commissionPercent: 30, // Attempt override by staff
        studentDiscountPercent: 20, // Attempt override by staff
      }),
    });
    assert(
      staffCreateAgent.status === 201 &&
      staffCreateAgent.data.data.commissionPercent === 0 &&
      staffCreateAgent.data.data.studentDiscountPercent === 0 &&
      staffCreateAgent.data.data.isConfigured === false,
      'Staff creation locks rates to 0% with isConfigured=false badge'
    );

    // 4. Rate-Limiting & Neutral Error on Validate Endpoint
    const invalidValidate = await request('/api/referral/validate', {
      method: 'POST',
      body: JSON.stringify({ code: 'NONEXISTENT99' }),
    });
    assert(invalidValidate.status === 400 && invalidValidate.data.error.message === 'This code is not valid.', 'Invalid promo code returns neutral error without leaking status');

    const validValidate = await request('/api/referral/validate', {
      method: 'POST',
      body: JSON.stringify({ code: agentPromoCode, programSlug: 'bba' }),
    });
    assert(
      validValidate.status === 200 &&
      validValidate.data.data.valid === true &&
      validValidate.data.data.discountPercent === 10 &&
      validValidate.data.data.discountAmount === 50 &&
      validValidate.data.data.finalFee === 450,
      'Valid promo code calculates 10% discount accurately (₹50 off ₹500 fee = ₹450)'
    );

    // 5. Anti-Fraud: Self-Referral Prevention
    const selfReferralEmail = await request('/api/admissions/apply', {
      method: 'POST',
      body: JSON.stringify({
        programSlug: 'bba',
        fullName: 'Self Referral Test',
        email: 'prashant.dhavan@testagency.com', // Agent's email!
        phone: '9998887776',
        dob: '2004-05-15',
        gender: 'MALE',
        address: '123 Test Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        board10: 'CBSE',
        year10: '2020',
        board12: 'CBSE',
        year12: '2022',
        stream: 'COMMERCE',
        percentage: '85',
        promoCode: agentPromoCode,
      }),
    });
    assert(selfReferralEmail.status === 400 && selfReferralEmail.data.error.code === 'SELF_REFERRAL_NOT_ALLOWED', 'Anti-fraud: Self-referral by agent email is strictly rejected');

    const selfReferralPhone = await request('/api/admissions/apply', {
      method: 'POST',
      body: JSON.stringify({
        programSlug: 'bba',
        fullName: 'Self Referral Test 2',
        email: 'another.candidate@gmail.com',
        phone: '9876543210', // Agent's phone!
        dob: '2004-05-15',
        gender: 'FEMALE',
        address: '123 Test Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        board10: 'CBSE',
        year10: '2020',
        board12: 'CBSE',
        year12: '2022',
        stream: 'COMMERCE',
        percentage: '85',
        promoCode: agentPromoCode,
      }),
    });
    assert(selfReferralPhone.status === 400 && selfReferralPhone.data.error.code === 'SELF_REFERRAL_NOT_ALLOWED', 'Anti-fraud: Self-referral by agent phone is strictly rejected');

    // 6. Admission Submission with Promo Code (Creates Commission with PENDING status)
    const referredAdmission = await request('/api/admissions/apply', {
      method: 'POST',
      body: JSON.stringify({
        programSlug: 'bba',
        fullName: 'Rohan Sharma',
        email: 'rohan.sharma@example.com',
        phone: '9811223344',
        dob: '2004-08-20',
        gender: 'MALE',
        address: '45 Green Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560025',
        board10: 'CBSE',
        year10: '2020',
        board12: 'CBSE',
        year12: '2022',
        stream: 'COMMERCE',
        percentage: '84',
        promoCode: agentPromoCode,
      }),
    });
    assert(
      referredAdmission.status === 201 &&
      referredAdmission.data.data.promoCodeUsed === agentPromoCode &&
      referredAdmission.data.data.finalFee === 450 &&
      referredAdmission.data.data.discountAmount === 50,
      'Referred application submitted: server applies ₹50 discount and charges net fee ₹450'
    );
    const applicationId = referredAdmission.data.data.id;

    // Verify Commission Created as PENDING
    const commListRes = await request(`/api/referral/commissions?agentId=${agentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const comm = commListRes.data.data.find(c => c.admissionId === applicationId);
    // Base amount = 45000 paise (₹450), 15% commission = 6750 paise (₹67.50)
    assert(
      Boolean(comm) &&
      comm.status === 'PENDING' &&
      comm.baseAmount === 45000 &&
      comm.commissionPercent === 15 &&
      comm.commissionAmount === 6750,
      'Ledger commission created with status PENDING and exact paise calculation (₹67.50)'
    );

    // 7. Commission Lifecycle Hook: Payment Verification -> APPROVED
    const razorpayOrder = await request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount: 450,
        purpose: 'APPLICATION_FEE',
        applicationId,
        customerName: 'Rohan Sharma',
        customerEmail: 'rohan.sharma@example.com',
        customerPhone: '9811223344',
      }),
    });
    const orderId = razorpayOrder.data.data.orderId;
    const paymentId = 'pay_referral_test_999';
    const signature = razorpaySignature(orderId, paymentId);

    const paymentVerify = await request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
      }),
    });
    assert(paymentVerify.status === 200, 'Student fee payment verified cryptographically');

    const updatedCommList = await request(`/api/referral/commissions?agentId=${agentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const updatedComm = updatedCommList.data.data.find(c => c.admissionId === applicationId);
    assert(updatedComm && updatedComm.status === 'APPROVED', 'Commission transitioned from PENDING -> APPROVED on payment confirmation');

    // 8. Agent Portal Auth & Student PII Masking
    const agentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'prashant.dhavan@testagency.com',
        password: agentInitialPassword,
      }),
    });
    assert(agentLogin.status === 200, 'Agent can authenticate into Partner Portal');
    const agentToken = agentLogin.data.data.token;

    const agentDashboardRes = await request('/api/referral/agent/dashboard', {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    assert(
      agentDashboardRes.status === 200 &&
      agentDashboardRes.data.data.metrics.totalApprovedCommissionINR === 67.5,
      'Agent dashboard reflects approved payable commission (₹67.50)'
    );

    const agentAdmissionsRes = await request('/api/referral/agent/admissions', {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    const agentAdmRow = agentAdmissionsRes.data.data.find(a => a.id === applicationId);
    assert(
      Boolean(agentAdmRow) &&
      agentAdmRow.maskedPhone.includes('****') &&
      agentAdmRow.maskedEmail.includes('****'),
      'Agent admissions view masks student contact information (PII protection: 98****44, r****@example.com)'
    );

    // 9. IDOR & Access Control: Agent cannot view other agents or admin endpoints
    const agentUnauthorized = await request('/api/referral/commissions', {
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    assert(agentUnauthorized.status === 403, 'IDOR/RBAC: Agent is forbidden from accessing all commissions endpoint');

    // 10. Commission Lifecycle Hook: Payout Recording -> PAID
    const payoutRes = await request('/api/referral/payouts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        agentId,
        method: 'UPI',
        reference: 'UPI-TXN-REF-789123',
        note: 'October commission payout',
      }),
    });
    assert(payoutRes.status === 201 && payoutRes.data.data.totalAmount === 6750, 'Super admin records batch payout and disburses ₹67.50');

    const paidCommList = await request(`/api/referral/commissions?agentId=${agentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const paidComm = paidCommList.data.data.find(c => c.admissionId === applicationId);
    assert(paidComm && paidComm.status === 'PAID' && paidComm.payoutId === payoutRes.data.data.id, 'Commission transitioned from APPROVED -> PAID with payout linkage');

    // 11. Admission Rejection / Cancellation Hook -> REVERSED
    // Submit second application to test reversal hook
    const secondAdmission = await request('/api/admissions/apply', {
      method: 'POST',
      body: JSON.stringify({
        programSlug: 'bca',
        fullName: 'Vikram Joshi',
        email: 'vikram.joshi@example.com',
        phone: '9844556677',
        dob: '2004-03-10',
        gender: 'MALE',
        address: '12 Jayanagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560041',
        board10: 'CBSE',
        year10: '2020',
        board12: 'CBSE',
        year12: '2022',
        stream: 'SCIENCE',
        percentage: '78',
        promoCode: agentPromoCode,
      }),
    });
    const secondAppId = secondAdmission.data.data.id;

    // Reject application as admin
    const rejectApp = await request(`/api/admissions/admin/applications/${secondAppId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'REJECTED', stage: 4, comment: 'Eligibility documents mismatched' }),
    });
    assert(rejectApp.status === 200, 'Admin rejects application');

    const reversedCommList = await request(`/api/referral/commissions?agentId=${agentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reversedComm = reversedCommList.data.data.find(c => c.admissionId === secondAppId);
    assert(reversedComm && reversedComm.status === 'REVERSED', 'Commission transitioned to REVERSED upon application rejection');

    // 12. Non-breaking regression verification: application without promo code
    const regularAdmission = await request('/api/admissions/apply', {
      method: 'POST',
      body: JSON.stringify({
        programSlug: 'bcom',
        fullName: 'Ananya Rao',
        email: 'ananya.rao@example.com',
        phone: '9733445566',
        dob: '2004-11-25',
        gender: 'FEMALE',
        address: '88 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        board10: 'CBSE',
        year10: '2020',
        board12: 'CBSE',
        year12: '2022',
        stream: 'COMMERCE',
        percentage: '92',
      }),
    });
    assert(
      regularAdmission.status === 201 &&
      regularAdmission.data.data.promoCodeUsed === null &&
      regularAdmission.data.data.finalFee === 500 &&
      regularAdmission.data.data.agentId === null,
      'Standard admission without promo code is 100% unaltered (full fee ₹500, no agent, no commission)'
    );

    // 13. Feature Flag OFF test (AGENT_REFERRAL_ENABLED=false)
    process.env.AGENT_REFERRAL_ENABLED = 'false';
    const flagOffValidate = await request('/api/referral/validate', {
      method: 'POST',
      body: JSON.stringify({ code: agentPromoCode }),
    });
    assert(flagOffValidate.status === 400 && flagOffValidate.data.error.code === 'FEATURE_DISABLED', 'When feature flag is OFF, validation is cleanly rejected with FEATURE_DISABLED');

    const flagOffAdmission = await request('/api/admissions/apply', {
      method: 'POST',
      body: JSON.stringify({
        programSlug: 'bcom',
        fullName: 'Sneha Patel',
        email: 'sneha.patel@example.com',
        phone: '9744556677',
        dob: '2004-06-18',
        gender: 'FEMALE',
        address: '100 Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        board10: 'CBSE',
        year10: '2020',
        board12: 'CBSE',
        year12: '2022',
        stream: 'COMMERCE',
        percentage: '89',
        promoCode: agentPromoCode, // submitted while flag is OFF
      }),
    });
    assert(
      flagOffAdmission.status === 201 &&
      flagOffAdmission.data.data.finalFee === 500 &&
      flagOffAdmission.data.data.promoCodeUsed === null,
      'When feature flag is OFF, admissions ignore promo codes and execute standard baseline workflow'
    );
    process.env.AGENT_REFERRAL_ENABLED = 'true'; // Restore flag

  } catch (err) {
    console.error('[REFERRAL TEST EXCEPTION]', err);
    failed++;
  } finally {
    console.log('====================================================');
    console.log(`REFERRAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

runReferralTestSuite();
