import http from 'http';
import app from './app';
import { env } from './config/env';
import { testDbConnection } from './config/db';
import { initSocket } from './sockets';

async function bootstrap() {
  await testDbConnection();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
