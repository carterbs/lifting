import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { createStretchSessionSchema, type CreateStretchSessionRequest } from '../shared.js';
import { validate } from '../middleware/validate.js';
import { errorHandler, NotFoundError } from '../middleware/error-handler.js';
import { stripPathPrefix } from '../middleware/strip-path-prefix.js';
import { requireAppCheck } from '../middleware/app-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { StretchSessionRepository } from '../repositories/stretchSession.repository.js';
import { getFirestoreDb } from '../firebase.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(stripPathPrefix('stretch-sessions'));
app.use(requireAppCheck);

// Lazy repository initialization
let repo: StretchSessionRepository | null = null;
function getRepo(): StretchSessionRepository {
  if (repo === null) {
    repo = new StretchSessionRepository(getFirestoreDb());
  }
  return repo;
}

// POST /stretch-sessions
app.post('/', validate(createStretchSessionSchema), asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const body = req.body as CreateStretchSessionRequest;
  const session = await getRepo().create(body);
  res.status(201).json({ success: true, data: session });
}));

// GET /stretch-sessions
app.get('/', asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const sessions = await getRepo().findAll();
  res.json({ success: true, data: sessions });
}));

// GET /stretch-sessions/latest
app.get('/latest', asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const session = await getRepo().findLatest();
  res.json({ success: true, data: session });
}));

// GET /stretch-sessions/:id
app.get('/:id', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params['id'] ?? '';
  const session = await getRepo().findById(id);
  if (session === null) {
    next(new NotFoundError('StretchSession', id));
    return;
  }
  res.json({ success: true, data: session });
}));

// Error handler must be last
app.use(errorHandler);

export const stretchSessionsApp = app;
