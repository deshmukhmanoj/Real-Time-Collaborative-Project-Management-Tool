import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app: Application = express();

// Security & parsing middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173', // npm run dev
  'http://localhost:4173', // npm run preview
  'https://deshmukhmanoj.github.io', // GitHub Pages
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin header (Postman, server-to-server, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'MD Taskboard API is running' });
});

// API routes
app.use('/api', routes);

// 404 + global error handler (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
