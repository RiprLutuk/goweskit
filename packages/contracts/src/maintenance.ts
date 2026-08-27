import { z } from 'zod';

export const MAINTENANCE_EVENT_TYPES = [
  'chain_clean',
  'chain_lube',
  'chain_replacement',
  'brake_pads',
  'tires',
  'sealant',
  'bearings',
  'fork_service',
  'shock_service',
  'drivetrain',
  'folding_hinge',
  'general_tune_up',
] as const;

export const maintenanceEventTypeSchema = z.enum(MAINTENANCE_EVENT_TYPES);
export type MaintenanceEventType = z.infer<typeof maintenanceEventTypeSchema>;

export const MAINTENANCE_EVENT_LABELS = {
  chain_clean: 'Clean chain',
  chain_lube: 'Lubricate chain',
  chain_replacement: 'Replace chain',
  brake_pads: 'Inspect or replace brake pads',
  tires: 'Inspect or replace tires',
  sealant: 'Refresh tubeless sealant',
  bearings: 'Service bearings',
  fork_service: 'Service fork',
  shock_service: 'Service rear shock',
  drivetrain: 'Service drivetrain',
  folding_hinge: 'Inspect folding hinge',
  general_tune_up: 'General tune-up',
} as const satisfies Record<MaintenanceEventType, string>;

export const maintenanceDueStatusSchema = z.enum([
  'none',
  'upcoming',
  'due',
  'overdue',
]);
export type MaintenanceDueStatus = z.infer<typeof maintenanceDueStatusSchema>;

export const createMaintenanceEventRequestSchema = z
  .object({
    type: maintenanceEventTypeSchema,
    performedAt: z.iso.date(),
    notes: z.string().trim().min(1).max(2000).nullable().optional(),
    nextDueDate: z.iso.date().nullable().optional(),
  })
  .refine(
    ({ nextDueDate, performedAt }) =>
      nextDueDate === null ||
      nextDueDate === undefined ||
      nextDueDate >= performedAt,
    {
      message: 'Next due date cannot be before the service date.',
      path: ['nextDueDate'],
    },
  );

export type CreateMaintenanceEventRequest = z.infer<
  typeof createMaintenanceEventRequestSchema
>;

export const maintenanceEventSchema = z.object({
  id: z.uuid(),
  bikeId: z.uuid(),
  type: maintenanceEventTypeSchema,
  performedAt: z.iso.date(),
  notes: z.string().nullable(),
  nextDueDate: z.iso.date().nullable(),
  dueStatus: maintenanceDueStatusSchema,
  createdAt: z.iso.datetime(),
});

export type MaintenanceEvent = z.infer<typeof maintenanceEventSchema>;

export const maintenanceEventResponseSchema = z.object({
  event: maintenanceEventSchema,
});
export type MaintenanceEventResponse = z.infer<
  typeof maintenanceEventResponseSchema
>;

export const maintenanceEventListResponseSchema = z.object({
  events: z.array(maintenanceEventSchema),
});
export type MaintenanceEventListResponse = z.infer<
  typeof maintenanceEventListResponseSchema
>;
