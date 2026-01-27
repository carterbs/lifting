import { Router } from 'express';
import { healthRouter } from './health.js';
import { exerciseRouter } from './exercise.routes.js';
import { planRouter } from './plan.routes.js';
import { mesocycleRouter } from './mesocycle.routes.js';
import { workoutRouter } from './workout.routes.js';
import { workoutSetRouter } from './workout-set.routes.js';
import { testRouter } from './test.routes.js';
import { stretchSessionRouter } from './stretchSession.routes.js';
import { calendarRouter } from './calendar.routes.js';
import { meditationSessionRouter } from './meditationSession.routes.js';
import { requireAppCheck } from '../middleware/app-check.js';

export const apiRouter = Router();

// Health endpoint - public (no App Check required)
apiRouter.use('/health', healthRouter);

// Protected routes - require App Check token
apiRouter.use('/exercises', requireAppCheck, exerciseRouter);
apiRouter.use('/plans', requireAppCheck, planRouter);
apiRouter.use('/mesocycles', requireAppCheck, mesocycleRouter);
apiRouter.use('/workouts', requireAppCheck, workoutRouter);
apiRouter.use('/workout-sets', requireAppCheck, workoutSetRouter);
apiRouter.use('/test', requireAppCheck, testRouter);
apiRouter.use('/stretch-sessions', requireAppCheck, stretchSessionRouter);
apiRouter.use('/calendar', requireAppCheck, calendarRouter);
apiRouter.use('/meditation-sessions', requireAppCheck, meditationSessionRouter);
