import { z } from 'zod';

import { createListQuerySchema } from '../../shared/validation/list-query.js';
import { USER_STATUSES } from '../users/user.types.js';
import { ENROLLMENT_STATUSES } from './enrollment.model.js';

export const ROSTER_SORT_FIELDS = ['fullName', 'email', 'joinedAt', 'status'] as const;

export const rosterListQuerySchema = createListQuerySchema(ROSTER_SORT_FIELDS, 'joinedAt')
  .extend({
    enrollmentStatus: z.enum(ENROLLMENT_STATUSES).optional(),
    accountStatus: z.enum(USER_STATUSES).optional(),
  })
  .strict();

export const removeStudentSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
    expectedEnrollmentUpdatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const classroomStudentIdSchema = z
  .object({
    classroomId: z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid Classroom ID'),
    studentId: z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid Student ID'),
  })
  .strict();

export type RosterListQueryInput = z.infer<typeof rosterListQuerySchema>;
export type RemoveStudentInput = z.infer<typeof removeStudentSchema>;
