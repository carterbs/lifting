import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  createMesocycleSchema,
  updateMesocycleSchema,
  type ApiResponse,
  type Mesocycle,
} from '@lifting/shared';
import { validate } from '../middleware/validate.js';
import { NotFoundError } from '../middleware/error-handler.js';
import { getMesocycleRepository } from '../repositories/index.js';

export const mesocycleRouter = Router();

// GET /api/mesocycles
mesocycleRouter.get(
  '/',
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getMesocycleRepository();
      const mesocycles = repository.findAll();

      const response: ApiResponse<Mesocycle[]> = {
        success: true,
        data: mesocycles,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mesocycles/active
mesocycleRouter.get(
  '/active',
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getMesocycleRepository();
      const mesocycles = repository.findActive();

      const response: ApiResponse<Mesocycle[]> = {
        success: true,
        data: mesocycles,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/mesocycles/:id
mesocycleRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getMesocycleRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Mesocycle', req.params['id'] ?? 'unknown');
      }

      const mesocycle = repository.findById(id);

      if (!mesocycle) {
        throw new NotFoundError('Mesocycle', id);
      }

      const response: ApiResponse<Mesocycle> = {
        success: true,
        data: mesocycle,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/mesocycles
mesocycleRouter.post(
  '/',
  validate(createMesocycleSchema),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getMesocycleRepository();
      const mesocycle = repository.create(req.body);

      const response: ApiResponse<Mesocycle> = {
        success: true,
        data: mesocycle,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/mesocycles/:id
mesocycleRouter.put(
  '/:id',
  validate(updateMesocycleSchema),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getMesocycleRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Mesocycle', req.params['id'] ?? 'unknown');
      }

      const mesocycle = repository.update(id, req.body);

      if (!mesocycle) {
        throw new NotFoundError('Mesocycle', id);
      }

      const response: ApiResponse<Mesocycle> = {
        success: true,
        data: mesocycle,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/mesocycles/:id
mesocycleRouter.delete(
  '/:id',
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const repository = getMesocycleRepository();
      const id = parseInt(req.params['id'] ?? '', 10);

      if (isNaN(id)) {
        throw new NotFoundError('Mesocycle', req.params['id'] ?? 'unknown');
      }

      const deleted = repository.delete(id);

      if (!deleted) {
        throw new NotFoundError('Mesocycle', id);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
