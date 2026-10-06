import { app } from './app';
import { config } from './config';
import { checkDatabaseConnection, memoryDb } from './database/client';

export async function bootstrap() {
  const isConnected = await checkDatabaseConnection();
  if (isConnected) {
    console.log('[DATABASE] PostgreSQL is connected.');
  } else {
    console.log('[DATABASE] PostgreSQL is unavailable. File-backed persistent storage (storage/data/app-data.json) is active.');
  }

  const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`DEEKSHAAM PRODUCTION PLATFORM API`);
    console.log(`Listening on: http://localhost:${config.port}`);
    console.log(`Health Check: http://localhost:${config.port}/api/health`);
    console.log(`Environment : ${config.env}`);
    console.log(`Storage     : ${config.storage.publicMedia}`);
    console.log(`====================================================`);
  });

  const shutdown = () => {
    console.log('\nGracefully shutting down server...');
    try {
      memoryDb.saveToFile();
      console.log('[STORAGE] Data snapshot saved to disk.');
    } catch (err: any) {
      console.error('[STORAGE] Error saving snapshot during shutdown:', err.message);
    }
    server.close(() => {
      console.log('Server terminated cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  process.on('unhandledRejection', (reason) => {
    console.error('[CRITICAL] Unhandled promise rejection in server process:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[CRITICAL] Uncaught exception in server process:', error);
    try {
      memoryDb.saveToFile();
    } catch {
      // ignore
    }
    process.exit(1);
  });
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
