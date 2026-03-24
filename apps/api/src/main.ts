import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { bindDashboardCacheInvalidationMiddleware } from './dashboard/dashboard-cache';

// --- session/csrf deps (require-style to avoid TS namespace-call issues) ---
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple');
const { Pool } = require('pg');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  bindDashboardCacheInvalidationMiddleware(app);
  (app.getHttpAdapter().getInstance() as any).set('trust proxy', 1);
  app.use(cookieParser());

  const PgSession = (pgSession as any)(session);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const sessionSecret =
    process.env.SESSION_SECRET || process.env.JWT_SECRET || 'CHANGE_ME_SESSION_SECRET';

  app.use(
    session({
      proxy: true,
name: 'lsid',
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new PgSession({
        pool,
        tableName: 'session',
      }),
      cookie: {
        httpOnly: true,
        secure: 'auto',
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
