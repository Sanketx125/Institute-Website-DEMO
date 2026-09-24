const assert = require('node:assert/strict');
const fs = require('fs');
const original = fs.realpathSync;
fs.realpathSync = (path, options) => { try { return original(path, options); } catch (error) { if (error.code === 'EPERM') return path; throw error; } };
fs.realpathSync.native = fs.realpathSync;
process.env.NODE_ENV = 'development';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
process.env.ADMIN_PASSWORD = 'WorkspaceTestAdmin@2026';
process.env.STAFF_PASSWORD = 'WorkspaceTestStaff@2026';
process.env.JWT_SECRET = 'workspace-test-secret-at-least-32-characters';
process.env.RAZORPAY_KEY_SECRET = 'workspace-test-razorpay-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'workspace-test-webhook-secret';
const { app } = require('../apps/api/dist/apps/api/src/app.js');
const server = app.listen(0, '127.0.0.1');
const base = () => `http://127.0.0.1:${server.address().port}`;
async function call(path, options = {}) {
  const response = await fetch(base() + path, { ...options, headers: { 'Content-Type': 'application/json', Origin: process.env.CLIENT_ORIGIN, ...(options.headers || {}) } });
  return { status: response.status, data: await response.json() };
}
async function main() {
  try {
    await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
    const tokens = {};
    const admin = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@deekshaam.edu', password: process.env.ADMIN_PASSWORD }) });
    assert.equal(admin.status, 200);
    tokens.SUPER_ADMIN = admin.data.data.token;
    for (const role of ['CONTENT_ADMIN', 'ADMISSION_STAFF', 'ENQUIRY_STAFF']) {
      const email = `${role.toLowerCase()}@example.invalid`;
      const password = `Test${role}2026!`;
      const createdRole = await call('/api/users', { method: 'POST', headers: { Authorization: `Bearer ${tokens.SUPER_ADMIN}` }, body: JSON.stringify({ email, name: role, role, password }) });
      assert.equal(createdRole.status, 201);
      const signed = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      assert.equal(signed.status, 200);
      tokens[role] = signed.data.data.token;
      const me = await call('/api/auth/me', { headers: { Authorization: `Bearer ${tokens[role]}` } });
      assert.equal(me.data.data.role, role);
    }
    const token = role => ({ Authorization: `Bearer ${tokens[role]}` });
    assert.equal((await call('/api/users', { headers: token('CONTENT_ADMIN') })).status, 403);
    assert.equal((await call('/api/enquiries/admin', { headers: token('ENQUIRY_STAFF') })).status, 200);
    assert.equal((await call('/api/admissions/admin/applications', { headers: token('ENQUIRY_STAFF') })).status, 403);
    assert.equal((await call('/api/admissions/admin/applications', { headers: token('ADMISSION_STAFF') })).status, 200);
    assert.equal((await call('/api/users', { headers: token('SUPER_ADMIN') })).status, 200);
    const created = await call('/api/users', { method: 'POST', headers: token('SUPER_ADMIN'), body: JSON.stringify({ email: 'test@example.invalid', name: 'Test Editor', role: 'CONTENT_ADMIN', password: 'FirstPassword1' }) });
    assert.equal(created.status, 201);
    const oldLogin = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'test@example.invalid', password: 'FirstPassword1' }) });
    assert.equal(oldLogin.status, 200);
    const oldToken = oldLogin.data.data.token;
    assert.equal((await call(`/api/users/${created.data.data.id}/password`, { method: 'PUT', headers: token('CONTENT_ADMIN'), body: JSON.stringify({ password: 'NewPassword2' }) })).status, 403);
    assert.equal((await call(`/api/users/${created.data.data.id}/password`, { method: 'PUT', headers: token('SUPER_ADMIN'), body: JSON.stringify({ password: 'weak' }) })).status, 400);
    assert.equal((await call(`/api/users/${created.data.data.id}/password`, { method: 'PUT', headers: token('SUPER_ADMIN'), body: JSON.stringify({ password: 'NewPassword2' }) })).status, 200);
    assert.equal((await call('/api/auth/me', { headers: { Authorization: `Bearer ${oldToken}` } })).status, 401);
    assert.equal((await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'test@example.invalid', password: 'FirstPassword1' }) })).status, 401);
    assert.equal((await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'test@example.invalid', password: 'NewPassword2' }) })).status, 200);

    assert.equal((await call('/api/cms/videos')).data.data.length, 0);
    const video = { id: 'video-1', youtubeId: 'abcdefghijk', title: 'Campus tour', category: 'Campus', duration: '3:02', description: 'Explore the campus.' };
    assert.equal((await call('/api/cms/videos', { method: 'PUT', headers: token('ENQUIRY_STAFF'), body: JSON.stringify([video]) })).status, 403);
    assert.equal((await call('/api/cms/videos', { method: 'PUT', headers: token('CONTENT_ADMIN'), body: JSON.stringify([{ ...video, youtubeId: 'invalid' }]) })).status, 400);
    assert.equal((await call('/api/cms/videos', { method: 'PUT', headers: token('CONTENT_ADMIN'), body: JSON.stringify([video]) })).status, 200);
    assert.equal((await call('/api/cms/videos')).data.data[0].title, 'Campus tour');
    const notice = { title: 'Campus update', date: '24 Sep 2026', priority: 'HIGH', status: 'PUBLISHED', fileUrl: '' };
    assert.equal((await call('/api/cms/notices/admin', { headers: token('ADMISSION_STAFF') })).status, 403);
    const createdNotice = await call('/api/cms/notices', { method: 'POST', headers: token('CONTENT_ADMIN'), body: JSON.stringify(notice) });
    assert.equal(createdNotice.status, 201);
    assert.equal((await call('/api/cms/notices')).data.data.some(n => n.id === createdNotice.data.data.id), true);
    assert.equal((await call(`/api/cms/notices/${createdNotice.data.data.id}`, { method: 'PUT', headers: token('CONTENT_ADMIN'), body: JSON.stringify({ ...notice, status: 'ARCHIVED' }) })).status, 200);
    assert.equal((await call('/api/cms/notices')).data.data.some(n => n.id === createdNotice.data.data.id), false);
    assert.equal((await call('/api/cms/notices/admin', { headers: token('CONTENT_ADMIN') })).data.data.some(n => n.id === createdNotice.data.data.id), true);

    assert.equal((await call('/api/auth/demo')).status, 404);
    console.log('PASS: staff login, role permissions, password reset and session revocation, shared videos and notice publishing.');
  } finally { server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
