import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { APP_VERSION, createSuccessResponse } from '@lifting/shared';
import { initializeDatabase } from './db/index.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, requestLogger } from './middleware/index.js';

const app: Express = express();
const PORT = process.env['PORT'] ?? 3001;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());

// Request logging
app.use(requestLogger);

// Initialize database
initializeDatabase();

// API routes
app.use('/api', apiRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response): void => {
  res.json(
    createSuccessResponse({
      message: 'Lifting API',
      version: APP_VERSION,
    })
  );
});

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});

export { app };
