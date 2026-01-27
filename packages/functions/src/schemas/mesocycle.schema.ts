import { z } from 'zod';

export const mesocycleStatusSchema = z.enum([
  'active',
  'completed',
  'cancelled',
]);

// ISO 8601 date format: YYYY-MM-DD
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createMesocycleSchema = z.object({
  plan_id: z.number().int().positive(),
  start_date: dateStringSchema,
});

export const updateMesocycleSchema = z.object({
  current_week: z.number().int().positive().optional(),
  status: mesocycleStatusSchema.optional(),
});

export type CreateMesocycleInput = z.infer<typeof createMesocycleSchema>;
export type UpdateMesocycleInput = z.infer<typeof updateMesocycleSchema>;
