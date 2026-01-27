import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import {
  createExerciseSchema,
  updateExerciseSchema,
  type CreateExerciseDTO,
  type UpdateExerciseDTO,
} from '../shared.js';
import { validate } from '../middleware/validate.js';
import { errorHandler, NotFoundError, ConflictError } from '../middleware/error-handler.js';
import { stripPathPrefix } from '../middleware/strip-path-prefix.js';
import { requireAppCheck } from '../middleware/app-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { ExerciseRepository } from '../repositories/exercise.repository.js';
import { getFirestoreDb } from '../firebase.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(stripPathPrefix('exercises'));
app.use(requireAppCheck);

// Lazy repository initialization
let exerciseRepo: ExerciseRepository | null = null;
function getRepo(): ExerciseRepository {
  if (exerciseRepo === null) {
    exerciseRepo = new ExerciseRepository(getFirestoreDb());
  }
  return exerciseRepo;
}

// GET /exercises
app.get('/', asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const exercises = await getRepo().findAll();
  res.json({ success: true, data: exercises });
}));

// GET /exercises/default
app.get('/default', asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const exercises = await getRepo().findDefaultExercises();
  res.json({ success: true, data: exercises });
}));

// GET /exercises/custom
app.get('/custom', asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  const exercises = await getRepo().findCustomExercises();
  res.json({ success: true, data: exercises });
}));

// GET /exercises/:id
app.get('/:id', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params['id'] ?? '';
  const exercise = await getRepo().findById(id);
  if (exercise === null) {
    next(new NotFoundError('Exercise', id));
    return;
  }
  res.json({ success: true, data: exercise });
}));

// POST /exercises
app.post('/', validate(createExerciseSchema), asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const body = req.body as CreateExerciseDTO;
  const exercise = await getRepo().create(body);
  res.status(201).json({ success: true, data: exercise });
}));

// PUT /exercises/:id
app.put('/:id', validate(updateExerciseSchema), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params['id'] ?? '';
  const body = req.body as UpdateExerciseDTO;
  const exercise = await getRepo().update(id, body);
  if (exercise === null) {
    next(new NotFoundError('Exercise', id));
    return;
  }
  res.json({ success: true, data: exercise });
}));

// DELETE /exercises/:id
app.delete('/:id', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params['id'] ?? '';
  const isInUse = await getRepo().isInUse(id);
  if (isInUse) {
    next(new ConflictError('Cannot delete exercise that is used in plans'));
    return;
  }
  const deleted = await getRepo().delete(id);
  if (!deleted) {
    next(new NotFoundError('Exercise', id));
    return;
  }
  res.json({ success: true, data: { deleted: true } });
}));

// Error handler must be last
app.use(errorHandler);

export const exercisesApp = app;
