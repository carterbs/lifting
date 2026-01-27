import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import {
  logWorkoutSetSchema,
  type ApiResponse,
  type WorkoutSet,
  type LogWorkoutSetInput,
} from '../shared.js';
import { validate } from '../middleware/validate.js';
import { errorHandler, NotFoundError, ValidationError } from '../middleware/error-handler.js';
import { stripPathPrefix } from '../middleware/strip-path-prefix.js';
import { requireAppCheck } from '../middleware/app-check.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { getWorkoutSetService } from '../services/index.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(stripPathPrefix('workout-sets'));
app.use(requireAppCheck);

// PUT /workout-sets/:id/log
app.put(
  '/:id/log',
  validate(logWorkoutSetSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const service = getWorkoutSetService();
    const id = req.params['id'];

    if (id === undefined) {
      next(new NotFoundError('WorkoutSet', 'unknown'));
      return;
    }

    const body = req.body as LogWorkoutSetInput;
    try {
      const set = await service.log(id, {
        actual_reps: body.actual_reps,
        actual_weight: body.actual_weight,
      });

      const response: ApiResponse<WorkoutSet> = { success: true, data: set };
      res.json(response);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          next(new NotFoundError('WorkoutSet', id));
          return;
        }
        if (error.message.includes('Cannot') || error.message.includes('must be')) {
          next(new ValidationError(error.message));
          return;
        }
      }
      throw error;
    }
  })
);

// PUT /workout-sets/:id/skip
app.put('/:id/skip', asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const service = getWorkoutSetService();
  const id = req.params['id'];

  if (id === undefined) {
    next(new NotFoundError('WorkoutSet', 'unknown'));
    return;
  }

  try {
    const set = await service.skip(id);
    const response: ApiResponse<WorkoutSet> = { success: true, data: set };
    res.json(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('WorkoutSet', id));
        return;
      }
      if (error.message.includes('Cannot')) {
        next(new ValidationError(error.message));
        return;
      }
    }
    throw error;
  }
}));

// PUT /workout-sets/:id/unlog
app.put('/:id/unlog', asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const service = getWorkoutSetService();
  const id = req.params['id'];

  if (id === undefined) {
    next(new NotFoundError('WorkoutSet', 'unknown'));
    return;
  }

  try {
    const set = await service.unlog(id);
    const response: ApiResponse<WorkoutSet> = { success: true, data: set };
    res.json(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        next(new NotFoundError('WorkoutSet', id));
        return;
      }
      if (error.message.includes('Cannot')) {
        next(new ValidationError(error.message));
        return;
      }
    }
    throw error;
  }
}));

// Error handler must be last
app.use(errorHandler);

export const workoutSetsApp = app;
