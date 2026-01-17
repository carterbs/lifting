import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import { APP_VERSION, createSuccessResponse } from '@lifting/shared';
import { initializeDatabase } from './db/index.js';
import { healthRouter } from './routes/health.js';

const app: Express = express();
const PORT = process.env['PORT'] ?? 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/health', healthRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response): void => {
  res.json(
    createSuccessResponse({
      message: 'Lifting API',
      version: APP_VERSION,
    })
  );
});

// Start server
app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${String(PORT)}`);
});

export { app };
