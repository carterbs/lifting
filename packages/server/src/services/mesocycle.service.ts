import type { Firestore } from 'firebase-admin/firestore';
import type {
  Mesocycle,
  CreateMesocycleRequest,
  MesocycleWithDetails,
  WeekSummary,
  WorkoutSummary,
  DayOfWeek,
  PlanDay,
  PlanDayExercise,
  Exercise,
} from '@brad-os/shared';
import {
  MesocycleRepository,
  PlanRepository,
  PlanDayRepository,
  PlanDayExerciseRepository,
  ExerciseRepository,
  WorkoutRepository,
  WorkoutSetRepository,
} from '../repositories/index.js';

interface PlanDayWithExercises {
  day: PlanDay;
  exercises: Array<{
    planDayExercise: PlanDayExercise;
    exercise: Exercise;
  }>;
}

export class MesocycleService {
  private mesocycleRepo: MesocycleRepository;
  private planRepo: PlanRepository;
  private planDayRepo: PlanDayRepository;
  private planDayExerciseRepo: PlanDayExerciseRepository;
  private exerciseRepo: ExerciseRepository;
  private workoutRepo: WorkoutRepository;
  private workoutSetRepo: WorkoutSetRepository;

  constructor(db: Firestore) {
    this.mesocycleRepo = new MesocycleRepository(db);
    this.planRepo = new PlanRepository(db);
    this.planDayRepo = new PlanDayRepository(db);
    this.planDayExerciseRepo = new PlanDayExerciseRepository(db);
    this.exerciseRepo = new ExerciseRepository(db);
    this.workoutRepo = new WorkoutRepository(db);
    this.workoutSetRepo = new WorkoutSetRepository(db);
  }

  /**
   * Create a new mesocycle from a plan (in pending status, no workouts yet)
   * Validates plan exists and has workout days configured
   */
  async create(request: CreateMesocycleRequest): Promise<Mesocycle> {
    // Check if plan exists
    const plan = await this.planRepo.findById(request.plan_id);
    if (!plan) {
      throw new Error(`Plan with id ${request.plan_id} not found`);
    }

    // Get plan days with exercises to validate plan is properly configured
    const planDays = await this.planDayRepo.findByPlanId(request.plan_id);
    if (planDays.length === 0) {
      throw new Error('Plan has no workout days configured');
    }

    // Create mesocycle (defaults to 'pending' status)
    const mesocycle = await this.mesocycleRepo.create({
      plan_id: request.plan_id,
      start_date: request.start_date,
    });

    return mesocycle;
  }

  /**
   * Start a pending mesocycle - generates workouts and sets status to active
   * Only one mesocycle can be active at a time
   */
  async start(id: string): Promise<Mesocycle> {
    const mesocycle = await this.mesocycleRepo.findById(id);
    if (!mesocycle) {
      throw new Error(`Mesocycle with id ${id} not found`);
    }

    if (mesocycle.status !== 'pending') {
      throw new Error('Only pending mesocycles can be started');
    }

    // Check for existing active mesocycle
    const activeMesocycles = await this.mesocycleRepo.findActive();
    if (activeMesocycles.length > 0) {
      throw new Error('An active mesocycle already exists');
    }

    // Get plan days with exercises
    const planDays = await this.planDayRepo.findByPlanId(mesocycle.plan_id);
    const planDaysWithExercises: PlanDayWithExercises[] = [];

    for (const day of planDays) {
      const planDayExercises = await this.planDayExerciseRepo.findByPlanDayId(
        day.id
      );
      const exercises: Array<{
        planDayExercise: PlanDayExercise;
        exercise: Exercise;
      }> = [];

      for (const pde of planDayExercises) {
        const exercise = await this.exerciseRepo.findById(pde.exercise_id);
        if (!exercise) {
          throw new Error(`Exercise with id ${pde.exercise_id} not found`);
        }
        exercises.push({
          planDayExercise: pde,
          exercise,
        });
      }

      planDaysWithExercises.push({ day, exercises });
    }

    // Generate workouts for each week (7 weeks total: 6 regular + 1 deload)
    await this.generateWorkouts(
      mesocycle.id,
      planDaysWithExercises,
      mesocycle.start_date
    );

    // Update status to active
    const updated = await this.mesocycleRepo.update(id, { status: 'active' });
    if (!updated) {
      throw new Error(`Failed to start mesocycle with id ${id}`);
    }

    return updated;
  }

  /**
   * Get the currently active mesocycle with details
   */
  async getActive(): Promise<MesocycleWithDetails | null> {
    const activeMesocycles = await this.mesocycleRepo.findActive();
    const firstActive = activeMesocycles[0];
    if (!firstActive) {
      return null;
    }

    return this.getById(firstActive.id);
  }

  /**
   * Get a mesocycle by ID with full details
   */
  async getById(id: string): Promise<MesocycleWithDetails | null> {
    const mesocycle = await this.mesocycleRepo.findById(id);
    if (!mesocycle) {
      return null;
    }

    const plan = await this.planRepo.findById(mesocycle.plan_id);
    const workouts = await this.workoutRepo.findByMesocycleId(id);
    const planDays = await this.planDayRepo.findByPlanId(mesocycle.plan_id);

    // Build week summaries
    const weeks: WeekSummary[] = [];
    for (let weekNum = 1; weekNum <= 7; weekNum++) {
      const weekWorkouts = workouts.filter((w) => w.week_number === weekNum);
      const workoutSummaries: WorkoutSummary[] = [];

      for (const workout of weekWorkouts) {
        const planDay = planDays.find((d) => d.id === workout.plan_day_id);
        const sets = await this.workoutSetRepo.findByWorkoutId(workout.id);
        const uniqueExercises = new Set(sets.map((s) => s.exercise_id));
        const completedSets = sets.filter(
          (s) => s.status === 'completed'
        ).length;

        const dayOfWeek: DayOfWeek = planDay?.day_of_week ?? 0;
        workoutSummaries.push({
          id: workout.id,
          plan_day_id: workout.plan_day_id,
          plan_day_name: planDay?.name ?? 'Unknown',
          day_of_week: dayOfWeek,
          week_number: workout.week_number,
          scheduled_date: workout.scheduled_date,
          status: workout.status,
          completed_at: workout.completed_at,
          exercise_count: uniqueExercises.size,
          set_count: sets.length,
          completed_set_count: completedSets,
        });
      }

      const completedWorkouts = weekWorkouts.filter(
        (w) => w.status === 'completed'
      ).length;
      const skippedWorkouts = weekWorkouts.filter(
        (w) => w.status === 'skipped'
      ).length;

      weeks.push({
        week_number: weekNum,
        is_deload: weekNum === 7,
        workouts: workoutSummaries,
        total_workouts: weekWorkouts.length,
        completed_workouts: completedWorkouts,
        skipped_workouts: skippedWorkouts,
      });
    }

    const totalWorkouts = workouts.length;
    const completedWorkouts = workouts.filter(
      (w) => w.status === 'completed'
    ).length;

    return {
      ...mesocycle,
      plan_name: plan?.name ?? 'Unknown',
      weeks,
      total_workouts: totalWorkouts,
      completed_workouts: completedWorkouts,
    };
  }

  /**
   * List all mesocycles
   */
  async list(): Promise<Mesocycle[]> {
    return this.mesocycleRepo.findAll();
  }

  /**
   * Mark a mesocycle as completed
   */
  async complete(id: string): Promise<Mesocycle> {
    const mesocycle = await this.mesocycleRepo.findById(id);
    if (!mesocycle) {
      throw new Error(`Mesocycle with id ${id} not found`);
    }

    if (mesocycle.status !== 'active') {
      throw new Error('Mesocycle is not active');
    }

    const updated = await this.mesocycleRepo.update(id, { status: 'completed' });
    if (!updated) {
      throw new Error(`Failed to update mesocycle with id ${id}`);
    }
    return updated;
  }

  /**
   * Cancel a mesocycle (preserves data)
   */
  async cancel(id: string): Promise<Mesocycle> {
    const mesocycle = await this.mesocycleRepo.findById(id);
    if (!mesocycle) {
      throw new Error(`Mesocycle with id ${id} not found`);
    }

    if (mesocycle.status !== 'active') {
      throw new Error('Mesocycle is not active');
    }

    const updated = await this.mesocycleRepo.update(id, { status: 'cancelled' });
    if (!updated) {
      throw new Error(`Failed to update mesocycle with id ${id}`);
    }
    return updated;
  }

  /**
   * Generate all workouts and sets for a mesocycle
   */
  private async generateWorkouts(
    mesocycleId: string,
    planDaysWithExercises: PlanDayWithExercises[],
    startDate: string
  ): Promise<void> {
    const startDateObj = new Date(startDate + 'T00:00:00');

    for (let weekNum = 1; weekNum <= 7; weekNum++) {
      const isDeload = weekNum === 7;

      for (const { day, exercises } of planDaysWithExercises) {
        // Calculate scheduled date based on week number and day_of_week
        const scheduledDate = this.calculateScheduledDate(
          startDateObj,
          weekNum,
          day.day_of_week
        );

        // Create workout
        const workout = await this.workoutRepo.create({
          mesocycle_id: mesocycleId,
          plan_day_id: day.id,
          week_number: weekNum,
          scheduled_date: scheduledDate,
        });

        // Create workout sets with progressive overload
        for (const { planDayExercise, exercise } of exercises) {
          const { targetReps, targetWeight, setCount } =
            this.calculateProgression(
              planDayExercise.reps,
              planDayExercise.weight,
              planDayExercise.sets,
              exercise.weight_increment,
              weekNum,
              isDeload
            );

          for (let setNum = 1; setNum <= setCount; setNum++) {
            await this.workoutSetRepo.create({
              workout_id: workout.id,
              exercise_id: exercise.id,
              set_number: setNum,
              target_reps: targetReps,
              target_weight: targetWeight,
            });
          }
        }
      }
    }
  }

  /**
   * Calculate scheduled date for a workout
   */
  private calculateScheduledDate(
    startDate: Date,
    weekNumber: number,
    dayOfWeek: DayOfWeek
  ): string {
    // Clone start date
    const date = new Date(startDate);

    // Calculate offset from start date's day of week to target day
    const startDayOfWeek = date.getDay();
    const dayOffset = dayOfWeek - startDayOfWeek;

    // Calculate the date
    const daysToAdd = (weekNumber - 1) * 7 + dayOffset;
    date.setDate(date.getDate() + daysToAdd);

    // Format as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculate progressive overload values for a week
   */
  private calculateProgression(
    baseReps: number,
    baseWeight: number,
    baseSets: number,
    weightIncrement: number,
    weekNumber: number,
    isDeload: boolean
  ): { targetReps: number; targetWeight: number; setCount: number } {
    if (isDeload) {
      return {
        targetReps: baseReps,
        targetWeight: baseWeight,
        setCount: Math.ceil(baseSets / 2),
      };
    }

    const weightIncreases = Math.floor(weekNumber / 2);
    const targetWeight = baseWeight + weightIncrement * weightIncreases;

    let targetReps = baseReps;
    if (weekNumber > 1 && weekNumber % 2 === 1) {
      targetReps = baseReps + 1;
    }

    return {
      targetReps,
      targetWeight,
      setCount: baseSets,
    };
  }
}
