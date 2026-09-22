import { app } from './app';
import { config } from './config';
import { checkDatabaseConnection } from './database/client';

export async function bootstrap() {
  const isConnected = await checkDatabaseConnection();
  if (isConnected) {
    console.log('[DATABASE] Connected successfully to PostgreSQL.');
  } else {
    console.log('[DATABASE] PostgreSQL not detected on localhost:5432. Active with high-availability in-memory repository.');
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
    server.close(() => {
      console.log('Server terminated cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
