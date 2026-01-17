import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  createExerciseSchema,
  updateExerciseSchema,
  type ApiResponse,
  type Exercise,
} from '@lifting/shared';
import { validate } from '../middleware/validate.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../middleware/error-handler.js';
import { getExerciseRepository } from '../repositories/index.js';

export const exerciseRouter = Router();

// GET /api/exercises
exerciseRouter.get(
  '/',
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getExerciseRepository();
      const exercises = repository.findAll();

      const response: ApiResponse<Exercise[]> = {
        success: true,
        data: exercises,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/exercises/:id
exerciseRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getExerciseRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Exercise', req.params['id'] ?? 'unknown');
      }

      const exercise = repository.findById(id);

      if (!exercise) {
        throw new NotFoundError('Exercise', id);
      }

      const response: ApiResponse<Exercise> = {
        success: true,
        data: exercise,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/exercises
exerciseRouter.post(
  '/',
  validate(createExerciseSchema),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getExerciseRepository();
      const exercise = repository.create(req.body);

      const response: ApiResponse<Exercise> = {
        success: true,
        data: exercise,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/exercises/:id
exerciseRouter.put(
  '/:id',
  validate(updateExerciseSchema),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getExerciseRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Exercise', req.params['id'] ?? 'unknown');
      }

      const exercise = repository.update(id, req.body);

      if (!exercise) {
        throw new NotFoundError('Exercise', id);
      }

      const response: ApiResponse<Exercise> = {
        success: true,
        data: exercise,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/exercises/:id
exerciseRouter.delete(
  '/:id',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getExerciseRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Exercise', req.params['id'] ?? 'unknown');
      }

      const exercise = repository.findById(id);

      if (!exercise) {
        throw new NotFoundError('Exercise', id);
      }

      if (!exercise.is_custom) {
        throw new ForbiddenError('Cannot delete built-in exercises');
      }

      if (repository.isInUse(id)) {
        throw new ConflictError('Cannot delete exercise that is used in a plan');
      }

      repository.delete(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
