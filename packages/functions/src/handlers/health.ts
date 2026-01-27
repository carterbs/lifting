import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: true }));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'cloud-functions',
    },
  });
});

export const healthApp = app;
