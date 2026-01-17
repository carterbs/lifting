import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  createWorkoutSetSchema,
  updateWorkoutSetSchema,
  logWorkoutSetSchema,
  type ApiResponse,
  type Workout,
  type WorkoutSet,
} from '@lifting/shared';
import { validate } from '../middleware/validate.js';
import { NotFoundError } from '../middleware/error-handler.js';
import {
  getWorkoutRepository,
  getWorkoutSetRepository,
} from '../repositories/index.js';

export const workoutRouter = Router();

// ============ Workouts ============

// GET /api/workouts
workoutRouter.get(
  '/',
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getWorkoutRepository();
      const workouts = repository.findAll();

      const response: ApiResponse<Workout[]> = {
        success: true,
        data: workouts,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/workouts/:id
workoutRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getWorkoutRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Workout', req.params['id'] ?? 'unknown');
      }

      const workout = repository.findById(id);

      if (!workout) {
        throw new NotFoundError('Workout', id);
      }

      const response: ApiResponse<Workout> = {
        success: true,
        data: workout,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/workouts
workoutRouter.post(
  '/',
  validate(createWorkoutSchema),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getWorkoutRepository();
      const workout = repository.create(req.body);

      const response: ApiResponse<Workout> = {
        success: true,
        data: workout,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/workouts/:id
workoutRouter.put(
  '/:id',
  validate(updateWorkoutSchema),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getWorkoutRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Workout', req.params['id'] ?? 'unknown');
      }

      const workout = repository.update(id, req.body);

      if (!workout) {
        throw new NotFoundError('Workout', id);
      }

      const response: ApiResponse<Workout> = {
        success: true,
        data: workout,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/workouts/:id/start
workoutRouter.put(
  '/:id/start',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getWorkoutRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Workout', req.params['id'] ?? 'unknown');
      }

      const workout = repository.update(id, {
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });

      if (!workout) {
        throw new NotFoundError('Workout', id);
      }

      const response: ApiResponse<Workout> = {
        success: true,
        data: workout,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/workouts/:id/complete
workoutRouter.put(
  '/:id/complete',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getWorkoutRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Workout', req.params['id'] ?? 'unknown');
      }

      const workout = repository.update(id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      if (!workout) {
        throw new NotFoundError('Workout', id);
      }

      const response: ApiResponse<Workout> = {
        success: true,
        data: workout,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/workouts/:id
workoutRouter.delete(
  '/:id',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getWorkoutRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Workout', req.params['id'] ?? 'unknown');
      }

      const deleted = repository.delete(id);

      if (!deleted) {
        throw new NotFoundError('Workout', id);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// ============ Workout Sets ============

// GET /api/workouts/:workoutId/sets
workoutRouter.get(
  '/:workoutId/sets',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const workoutRepository = getWorkoutRepository();
      const workoutSetRepository = getWorkoutSetRepository();
      const workoutId = parseInt(req.params['workoutId'] ?? '', 10);

      if (isNaN(workoutId)) {
        throw new NotFoundError(
          'Workout',
          req.params['workoutId'] ?? 'unknown'
        );
      }

      const workout = workoutRepository.findById(workoutId);
      if (!workout) {
        throw new NotFoundError('Workout', workoutId);
      }

      const sets = workoutSetRepository.findByWorkoutId(workoutId);

      const response: ApiResponse<WorkoutSet[]> = {
        success: true,
        data: sets,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/workouts/:workoutId/sets
workoutRouter.post(
  '/:workoutId/sets',
  validate(createWorkoutSetSchema.omit({ workout_id: true })),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const workoutRepository = getWorkoutRepository();
      const workoutSetRepository = getWorkoutSetRepository();
      const workoutId = parseInt(req.params['workoutId'] ?? '', 10);

      if (isNaN(workoutId)) {
        throw new NotFoundError(
          'Workout',
          req.params['workoutId'] ?? 'unknown'
        );
      }

      const workout = workoutRepository.findById(workoutId);
      if (!workout) {
        throw new NotFoundError('Workout', workoutId);
      }

      const set = workoutSetRepository.create({
        ...req.body,
        workout_id: workoutId,
      });

      const response: ApiResponse<WorkoutSet> = {
        success: true,
        data: set,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/workout-sets/:id
workoutRouter.put(
  '/sets/:id',
  validate(updateWorkoutSetSchema),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const workoutSetRepository = getWorkoutSetRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('WorkoutSet', req.params['id'] ?? 'unknown');
      }

      const set = workoutSetRepository.update(id, req.body);

      if (!set) {
        throw new NotFoundError('WorkoutSet', id);
      }

      const response: ApiResponse<WorkoutSet> = {
        success: true,
        data: set,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/workout-sets/:id/log
workoutRouter.put(
  '/sets/:id/log',
  validate(logWorkoutSetSchema),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const workoutSetRepository = getWorkoutSetRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('WorkoutSet', req.params['id'] ?? 'unknown');
      }

      const set = workoutSetRepository.update(id, {
        actual_reps: req.body.actual_reps,
        actual_weight: req.body.actual_weight,
        status: 'completed',
      });

      if (!set) {
        throw new NotFoundError('WorkoutSet', id);
      }

      const response: ApiResponse<WorkoutSet> = {
        success: true,
        data: set,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/workout-sets/:id/skip
workoutRouter.put(
  '/sets/:id/skip',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const workoutSetRepository = getWorkoutSetRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('WorkoutSet', req.params['id'] ?? 'unknown');
      }

      const set = workoutSetRepository.update(id, {
        status: 'skipped',
      });

      if (!set) {
        throw new NotFoundError('WorkoutSet', id);
      }

      const response: ApiResponse<WorkoutSet> = {
        success: true,
        data: set,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/workout-sets/:id
workoutRouter.delete(
  '/sets/:id',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const workoutSetRepository = getWorkoutSetRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('WorkoutSet', req.params['id'] ?? 'unknown');
      }

      const deleted = workoutSetRepository.delete(id);

      if (!deleted) {
        throw new NotFoundError('WorkoutSet', id);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
