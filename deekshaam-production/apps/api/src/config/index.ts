import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/deekshaam_production?schema=public',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'deekshaam-production-secret-key-change-in-prod-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  },

  storage: {
    publicMedia: path.resolve(__dirname, '../../../storage/public-media'),
    privateDocuments: path.resolve(__dirname, '../../../storage/private-documents'),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_placeholder',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'local',
    apiKey: process.env.AI_API_KEY || '',
    modelName: process.env.AI_MODEL_NAME || 'local-knowledge',
  },

  features: {
    enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false',
    enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
  },
};
