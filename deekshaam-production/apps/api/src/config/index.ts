import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

function requiredSecret(name: string): string {
  const value = process.env[name];
  if (value && value.trim()) return value.trim();
  if (isProduction) {
    console.error(`[CONFIG] FATAL: environment variable ${name} is required in production. Refusing to start with fallback secrets.`);
    process.exit(1);
  }
  return crypto.randomBytes(32).toString('hex');
}

export function requiredPassword(envName: string, label: string): string {
  const value = process.env[envName];
  if (value && value.trim()) return value.trim();
  console.error(`[CONFIG] FATAL: ${envName} is required to bootstrap the ${label} account. Set it in the API environment before starting the server.`);
  process.exit(1);
}

if (isProduction && (!process.env.CLIENT_ORIGIN || !process.env.CLIENT_ORIGIN.trim())) {
  console.error('[CONFIG] FATAL: environment variable CLIENT_ORIGIN is required in production (CORS allow-list).');
  process.exit(1);
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction,
  port: parseInt(process.env.PORT || '5000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/deekshaam_production?schema=public',

  jwt: {
    secret: requiredSecret('JWT_SECRET'),
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
    keySecret: requiredSecret('RAZORPAY_KEY_SECRET'),
    webhookSecret: requiredSecret('RAZORPAY_WEBHOOK_SECRET'),
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
