// Sets deterministic test credentials/secrets before the API app module loads.
process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-jwt-secret-not-for-production-use';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'integration-test-razorpay-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'integration-test-razorpay-webhook-secret';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
process.env.STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Staff@123456';

export {};
