import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { APP_VERSION, createSuccessResponse } from '@brad-os/shared';
import { initializeDatabase } from './db/index.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, requestLogger } from './middleware/index.js';

const app: Express = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());

// Request logging
app.use(requestLogger);

// API routes
app.use('/api', apiRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response): void => {
  res.json(
    createSuccessResponse({
      message: 'Brad OS API',
      version: APP_VERSION,
    })
  );
});

// Error handling (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    await initializeDatabase();

    app.listen(PORT, (): void => {
      console.log(`Server running on http://localhost:${String(PORT)}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app };
