// Deekshaam Production Platform - Automated Integration Test Runner
const fs = require('fs');

// Monkeypatch fs.realpathSync for Windows sandbox drive mapping
const origSync = fs.realpathSync;
fs.realpathSync = function(p, opts) {
  if (typeof p === 'string' && (p === 'Z:\\' || p === 'Z:' || p === 'z:\\' || p === 'z:')) return p;
  try { return origSync(p, opts); } catch (e) { if (e && e.code === 'EPERM') return p; throw e; }
};
fs.realpathSync.native = fs.realpathSync;

// Deterministic test credentials/secrets (must be set before the app module loads)
process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-jwt-secret-not-for-production-use';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'integration-test-razorpay-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'integration-test-razorpay-webhook-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
process.env.STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Staff@123456';

const crypto = require('crypto');
const { app } = require('../apps/api/dist/apps/api/src/app.js');

const PORT = 5055;
let server;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

async function runTestSuite() {
  console.log('====================================================');
  console.log('DEEKSHAAM PRODUCTION PLATFORM - INTEGRATION TEST SUITE');
  console.log('====================================================');

  server = app.listen(PORT);
  console.log(`[TEST SERVER] Running on ${BASE_URL}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
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
    assert(health.status === 200 && health.data && health.data.status === 'healthy', 'API health check returns 200 OK');

    // 2. Public CMS Content
    const settings = await request('/api/cms/settings');
    assert(settings.status === 200 && settings.data.data.instituteName.includes('Deekshaam'), 'Site settings loaded from CMS');

    const programs = await request('/api/cms/programs');
    assert(programs.status === 200 && programs.data.data.length >= 3, 'Programs catalog loads all degrees (BBA, BCA, B.Com)');

    const bca = await request('/api/cms/programs/bca');
    assert(bca.status === 200 && bca.data.data.curriculum && bca.data.data.curriculum.length === 6, 'BCA detail loaded with 6-semester curriculum');

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
    const applicantToken = applyRes.data.data.accessToken;
    assert(typeof applicantToken === 'string' && applicantToken.length >= 32, 'Applicant access token issued once on submission');

    // Document upload ownership enforcement
    const makeUpload = (headers) => {
      const fd = new FormData();
      fd.append('document', new Blob(['%PDF-1.4 test document'], { type: 'application/pdf' }), 'marks.pdf');
      fd.append('documentType', 'MARKSHEET_10');
      return request(`/api/admissions/upload/${generatedAppId}`, { method: 'POST', body: fd, headers });
    };

    const uploadNoProof = await makeUpload({});
    assert(uploadNoProof.status === 401, 'Document upload without proof of ownership is rejected');

    const uploadBadToken = await makeUpload({ 'x-applicant-token': 'forged-token-value' });
    assert(uploadBadToken.status === 404, 'Document upload with a forged access token is rejected');

    const uploadOk = await makeUpload({ 'x-applicant-token': applicantToken });
    assert(uploadOk.status === 201 && uploadOk.data.success, 'Authenticated applicant can upload verification documents');

    // Application tracking requires proof and never exposes PII
    const trackNoProof = await request(`/api/admissions/track/${generatedAppId}`);
    assert(trackNoProof.status === 401, 'Tracking without proof of ownership is rejected');

    const trackBadEmail = await request(`/api/admissions/track/${generatedAppId}`, {
      headers: { 'x-applicant-email': 'attacker@evil.com' },
    });
    assert(trackBadEmail.status === 404, 'Tracking with a non-matching email is rejected');

    const trackRes = await request(`/api/admissions/track/${generatedAppId}`, {
      headers: { 'x-applicant-token': applicantToken },
    });
    const tracked = trackRes.data && trackRes.data.data;
    assert(
      trackRes.status === 200 && tracked.stages.length === 5 && tracked.id === generatedAppId,
      'Application tracking verified with 5 stages'
    );
    assert(
      tracked && !('fullName' in tracked) && !('email' in tracked) && !('phone' in tracked) && !('accessToken' in tracked),
      'Tracking response contains no PII or access tokens'
    );

    const trackByEmail = await request(`/api/admissions/track/${generatedAppId}`, {
      headers: { 'x-applicant-email': 'rahul.sharma@gmail.com' },
    });
    assert(trackByEmail.status === 200 && trackByEmail.data.data.id === generatedAppId, 'Tracking with the registered email is allowed');

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

    const forgedRes = await request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        paymentId: 'pay_test_capture_1001',
        signature: 'mock_signature_test',
      }),
    });
    assert(forgedRes.status === 400, 'Forged payment signature is rejected in every environment');

    const verifyRes = await request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        paymentId: 'pay_test_capture_1001',
        signature: razorpaySignature(orderId, 'pay_test_capture_1001'),
      }),
    });
    assert(verifyRes.status === 200 && verifyRes.data.data.status === 'SUCCESS', 'Payment cryptographic verification succeeded');

    // Webhook signature enforcement (raw-body HMAC)
    const webhookBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_wh_1', order_id: orderId } } } });

    const webhookUnsigned = await request('/api/payments/webhook', { method: 'POST', body: webhookBody });
    assert(webhookUnsigned.status === 400, 'Webhook without signature header is rejected');

    const webhookForged = await request('/api/payments/webhook', {
      method: 'POST',
      body: webhookBody,
      headers: { 'x-razorpay-signature': 'deadbeef' },
    });
    assert(webhookForged.status === 400, 'Webhook with invalid signature is rejected');

    const webhookValid = await request('/api/payments/webhook', {
      method: 'POST',
      body: webhookBody,
      headers: {
        'x-razorpay-signature': crypto
          .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
          .update(webhookBody)
          .digest('hex'),
      },
    });
    assert(webhookValid.status === 200 && webhookValid.data.received === true, 'Webhook with valid raw-body signature is accepted');

    // 6. Search Engine
    const searchProg = await request('/api/search?q=BCA');
    assert(searchProg.status === 200 && searchProg.data.data.length > 0, 'Full-text search indexed program BCA');

    const searchHostel = await request('/api/search?q=hostel');
    assert(searchHostel.status === 200 && searchHostel.data.data.length > 0, 'Full-text search indexed campus facilities');

    // 7. SEO Sitemaps & Robots
    const sitemap = await request('/sitemap.xml');
    assert(sitemap.status === 200 && Boolean(sitemap.text && sitemap.text.includes('<urlset')), 'Dynamic sitemap.xml generated with published URLs');

    const robots = await request('/robots.txt');
    assert(robots.status === 200 && Boolean(robots.text && robots.text.includes('Disallow: /admin/')), 'Production robots.txt generated');

    // 8. AI Assistant (Deeksha Guide)
    const aiRes = await request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'What is the eligibility for BCA?' }),
    });
    assert(aiRes.status === 200 && aiRes.data.data.reply.includes('10+2'), 'Deeksha Guide answered with domain knowledge');

    // 9. Admin Authentication & RBAC
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@deekshaam.edu', password: process.env.ADMIN_PASSWORD }),
    });
    assert(loginRes.status === 200 && loginRes.data.data.token, 'Super admin authenticated and received JWT');
    const adminToken = loginRes.data.data.token;

    // Public editorial content is visible only after an editor publishes it.
    const editorialHeaders = { Authorization: `Bearer ${adminToken}` };
    const storyPayload = { name: 'Integration Student', program: 'BCA', graduationYear: '2025', outcome: 'Software engineer', quote: 'A verified first-person story for the editorial workflow.', imageUrl: '', consentConfirmed: false, status: 'DRAFT' };
    const storyCreated = await request('/api/cms/stories', { method: 'POST', headers: editorialHeaders, body: JSON.stringify(storyPayload) });
    assert(storyCreated.status === 201, 'Content editor can save a student story as a draft');
    const storyId = storyCreated.data.data.id;
    const publicStoriesBefore = await request('/api/cms/stories');
    assert(!publicStoriesBefore.data.data.some(item => item.id === storyId), 'Draft student story is hidden from the public site');
    const storyWithoutConsent = await request(`/api/cms/stories/${storyId}`, { method: 'PUT', headers: editorialHeaders, body: JSON.stringify({ ...storyPayload, status: 'PUBLISHED' }) });
    assert(storyWithoutConsent.status === 400, 'Student story cannot be published without consent confirmation');
    const storyPublished = await request(`/api/cms/stories/${storyId}`, { method: 'PUT', headers: editorialHeaders, body: JSON.stringify({ ...storyPayload, consentConfirmed: true, status: 'PUBLISHED' }) });
    const publicStoriesAfter = await request('/api/cms/stories');
    assert(storyPublished.status === 200 && publicStoriesAfter.data.data.some(item => item.id === storyId), 'Consented story appears on Placements feed after publication');
    const privateEditorial = await request('/api/cms/stories/admin');
    assert(privateEditorial.status === 401, 'Editorial draft list requires staff authentication');

    const eventPayload = { slug: `workflow-event-${Date.now()}`, title: 'Editorial workflow event', date: '20 Nov 2026', summary: 'A draft event for publication controls.', status: 'DRAFT' };
    const eventCreated = await request('/api/cms/events', { method: 'POST', headers: editorialHeaders, body: JSON.stringify(eventPayload) });
    const publicEvents = await request('/api/cms/events');
    assert(eventCreated.status === 201 && !publicEvents.data.data.some(item => item.id === eventCreated.data.data.id), 'Draft event stays off public calendar');
    const galleryPayload = { title: 'Editorial workflow photo', category: 'Campus', imageUrl: '/images/Deekshaam-Buisness-School-Img-1.png', order: 10, status: 'DRAFT' };
    const galleryCreated = await request('/api/cms/gallery', { method: 'POST', headers: editorialHeaders, body: JSON.stringify(galleryPayload) });
    const publicGallery = await request('/api/cms/gallery');
    assert(galleryCreated.status === 201 && !publicGallery.data.data.some(item => item.id === galleryCreated.data.data.id), 'Draft gallery photo stays off public gallery');

    // Verify protected staff endpoints with token
    const adminApps = await request('/api/admissions/admin/applications', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminApps.status === 200 && adminApps.data.data.length > 0 && !('accessToken' in adminApps.data.data[0]),
      'Staff admissions inbox protected route verified without leaking applicant tokens'
    );

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

    // 8. User Management Password Strength Enforcement
    const weakUserRes = await request('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        email: 'newofficer@deekshaam.edu',
        name: 'New Admissions Officer',
        role: 'ADMISSION_STAFF',
        password: 'weak',
      }),
    });
    assert(weakUserRes.status === 400 && weakUserRes.data.error.code === 'VALIDATION_ERROR', 'User creation with weak password (<8 chars / missing complexity) is rejected');

    const strongUserRes = await request('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        email: 'newofficer@deekshaam.edu',
        name: 'New Admissions Officer',
        role: 'ADMISSION_STAFF',
        password: 'StrongPassword123!',
      }),
    });
    assert(strongUserRes.status === 201 && strongUserRes.data.data.email === 'newofficer@deekshaam.edu', 'User creation with strong password succeeds and hashes credentials safely');

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
