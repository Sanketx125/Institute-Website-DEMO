// Silence Vite CJS deprecation warning when loading Vite API or config files
process.env.VITE_CJS_IGNORE_WARNING = 'true';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Preserve realpathSync patch for Windows symlinks and sandbox handling
const original = fs.realpathSync;
fs.realpathSync = (p, options) => {
  try {
    return original(p, options);
  } catch (error) {
    if (error && error.code === 'EPERM') return p;
    throw error;
  }
};
fs.realpathSync.native = fs.realpathSync;

async function startPlatform() {
  console.log('====================================================');
  console.log('STARTING DEEKSHAAM PRODUCTION PLATFORM');
  console.log('====================================================');

  // 1. Start Backend API Server
  try {
    const apiServer = require('../apps/api/dist/apps/api/src/server.js');
    if (apiServer.bootstrap) {
      await apiServer.bootstrap();
    }
  } catch (err) {
    console.error('[API ERROR] Failed to start backend API:', err);
  }

  // 2. Start Frontend Vite Dev Server via Native ESM API
  try {
    const { createServer } = await import('vite');
    const viteServer = await createServer({
      configFile: path.resolve(__dirname, '../apps/web/vite.config.ts'),
      root: path.resolve(__dirname, '../apps/web'),
      clearScreen: false,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
    });

    await viteServer.listen();
    console.log('\n====================================================');
    console.log('DEEKSHAAM PLATFORM READY:');
    console.log('  🌐 Web Application : http://localhost:3000');
    console.log('  🔒 Admin CMS Login  : http://localhost:3000/admin');
    console.log('  ⚙️  REST API Engine : http://localhost:5000/api/health');
    console.log('====================================================\n');
  } catch (err) {
    console.error('[VITE ERROR] Failed to start frontend dev server:', err);
  }
}

startPlatform().catch(console.error);
