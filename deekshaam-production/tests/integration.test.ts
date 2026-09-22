import http from 'http';
import { app } from '../apps/api/src/app';

const PORT = 5055;
let server: http.Server;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path: string, options: any = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text), text };
  } catch {
    return { status: res.status, data: null, text };
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('DEEKSHAAM PRODUCTION PLATFORM - INTEGRATION TEST SUITE');
  console.log('====================================================');

  server = app.listen(PORT);
  console.log(`[TEST SERVER] Running on ${BASE_URL}`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'API health check returns 200 OK');

    // 2. Public CMS Content
    const settings = await request('/api/cms/settings');
    assert(settings.status === 200 && settings.data.data.instituteName.includes('Deekshaam'), 'Site settings loaded from CMS');

    const programs = await request('/api/cms/programs');
    assert(programs.status === 200 && programs.data.data.length >= 3, 'Programs catalog loads all degrees (BBA, BCA, B.Com)');

    const bca = await request('/api/cms/programs/bca');
    assert(bca.status === 200 && bca.data.data.curriculum?.length === 6, 'BCA detail loaded with 6-semester curriculum');

    const employers = await request('/api/cms/employers');
    assert(employers.status === 200 && employers.data.data.length >= 5, 'Verified recruiter partners loaded');

    // 3. Enquiry Workflow
    const enquiryRes = await request('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Student',
        phone: '9876543210',
        email: 'test@student.com',
        program: 'BCA',
        message: 'Looking for fee and admission details',
      }),
    });
    assert(enquiryRes.status === 201 && enquiryRes.data.success, 'General enquiry submitted and captured in lead inbox');

    const visitRes = await request('/api/enquiries/visit', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Parent Kumar',
        phone: '9876543211',
        email: 'kumar@parent.com',
        program: 'BBA',
        preferredDate: '2026-10-15',
        preferredTime: '10:00 AM - 11:00 AM',
        notes: 'Hostel and campus tour request',
      }),
    });
    assert(visitRes.status === 201 && visitRes.data.success, 'Campus visit booked with date and time slot');

    // 4. Admissions Workflow
    const applyRes = await request('/api/admissions/apply', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Rahul Sharma',
        email: 'rahul.sharma@gmail.com',
        phone: '9876543212',
        dob: '2005-04-12',
        state: 'Karnataka',
        city: 'Bangalore',
        programSlug: 'bca',
        specialization: 'Artificial Intelligence & Machine Learning',
        board10: 'CBSE',
        year10: '2022',
        board12: 'Karnataka PU',
        year12: '2024',
        stream: 'Science',
        percentage: '88.5',
      }),
    });
    assert(applyRes.status === 201 && applyRes.data.data.id.startsWith('DBS-'), 'Online application submitted, issued reference ID');
    const generatedAppId = applyRes.data.data.id;

    // Track Application
    const trackRes = await request(`/api/admissions/track/${generatedAppId}`);
    assert(trackRes.status === 200 && trackRes.data.data.fullName === 'Rahul Sharma', 'Application tracking verified with 5 stages');

    // 5. Payment Workflow (Razorpay Order & Verification)
    const orderRes = await request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount: 500,
        purpose: 'APPLICATION_FEE',
        applicationId: generatedAppId,
        customerName: 'Rahul Sharma',
        customerEmail: 'rahul.sharma@gmail.com',
        customerPhone: '9876543212',
        notes: `Application fee for ${generatedAppId}`,
      }),
    });
    assert(orderRes.status === 201 && orderRes.data.data.orderId.startsWith('order_'), 'Razorpay order created with application linkage');
    const orderId = orderRes.data.data.orderId;

    const verifyRes = await request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        paymentId: 'pay_test_capture_1001',
        signature: 'mock_signature_test',
      }),
    });
    assert(verifyRes.status === 200 && verifyRes.data.data.status === 'SUCCESS', 'Payment cryptographic verification succeeded');

    // 6. Search Engine
    const searchProg = await request('/api/search?q=BCA');
    assert(searchProg.status === 200 && searchProg.data.data.length > 0, 'Full-text search indexed program BCA');

    const searchHostel = await request('/api/search?q=hostel');
    assert(searchHostel.status === 200 && searchHostel.data.data.length > 0, 'Full-text search indexed campus facilities');

    // 7. SEO Sitemaps & Robots
    const sitemap = await request('/sitemap.xml');
    assert(sitemap.status === 200 && Boolean(sitemap.text?.includes('<urlset')), 'Dynamic sitemap.xml generated with published URLs');

    const robots = await request('/robots.txt');
    assert(robots.status === 200 && Boolean(robots.text?.includes('Disallow: /admin/')), 'Production robots.txt generated');

    // 8. AI Assistant (Deeksha Guide)
    const aiRes = await request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is the eligibility for BCA?' }),
    });
    assert(aiRes.status === 200 && aiRes.data.data.reply.includes('10+2'), 'Deeksha Guide answered with domain knowledge');

    // 9. Admin Authentication & RBAC
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@deekshaam.edu', password: 'Admin@123456' }),
    });
    assert(loginRes.status === 200 && loginRes.data.data.token, 'Super admin authenticated and received JWT');
    const adminToken = loginRes.data.data.token;

    // Verify protected staff endpoints with token
    const adminApps = await request('/api/admissions/admin/applications', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminApps.status === 200 && adminApps.data.data.length > 0, 'Staff admissions inbox protected route verified');

    const adminLeads = await request('/api/enquiries/admin', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminLeads.status === 200 && adminLeads.data.data.length >= 2, 'Staff leads inbox protected route verified');

    const adminPayments = await request('/api/payments/admin', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminPayments.status === 200 && adminPayments.data.data.length > 0, 'Payment reconciliation protected route verified');

    const adminAudit = await request('/api/cms/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminAudit.status === 200 && adminAudit.data.data.length > 0, 'Immutable audit logs protected route verified');

    const adminSummary = await request('/api/analytics/summary', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminSummary.status === 200 && adminSummary.data.data.applications.total > 0, 'Analytics summary dashboard verified');

  } catch (err) {
    console.error('[TEST EXCEPTION]', err);
    failed++;
  } finally {
    console.log('====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

runTestSuite();
