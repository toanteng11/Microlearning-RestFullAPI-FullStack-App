import { z } from 'zod';

import { ASSIGNMENT_STATUSES } from '../learning-content/assessment.types.js';
import { SUBMISSION_TYPES } from './assignment.types.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId');
const timestamp = z.iso.datetime({ offset: true });
const title = z
  .string()
  .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
  .pipe(z.string().min(2).max(150));
const instruction = z
  .string()
  .transform((value) => value.normalize('NFKC').replace(/\r\n?/gu, '\n').trim())
  .pipe(z.string().min(1).max(100_000));

export const teacherCourseAssignmentParamsSchema = z.object({ courseId: objectId }).strict();
export const assignmentParamsSchema = z.object({ assignmentId: objectId }).strict();
export const submissionParamsSchema = z.object({ submissionId: objectId }).strict();
export const previewAssignmentSchema = z.object({}).strict();

export const assignmentListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(ASSIGNMENT_STATUSES).optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

const assignmentFields = {
  moduleId: objectId.nullable().default(null),
  title,
  instruction,
  maxScore: z.number().int().min(1).max(1_000),
  isRequired: z.boolean().default(true),
  allowedSubmissionTypes: z.array(z.enum(SUBMISSION_TYPES)).min(1).max(3).default(['TEXT']),
  allowLateSubmission: z.boolean().default(false),
  allowUnsubmit: z.boolean().default(false),
  allowResubmit: z.boolean().default(false),
  availableFrom: timestamp.nullable().default(null),
  dueDate: timestamp,
} as const;

export const createAssignmentSchema = z.object(assignmentFields).strict();
export const updateAssignmentSchema = z
  .object({
    moduleId: objectId.nullable().optional(),
    title: title.optional(),
    instruction: instruction.optional(),
    maxScore: z.number().int().min(1).max(1_000).optional(),
    isRequired: z.boolean().optional(),
    allowedSubmissionTypes: z.array(z.enum(SUBMISSION_TYPES)).min(1).max(3).optional(),
    allowLateSubmission: z.boolean().optional(),
    allowUnsubmit: z.boolean().optional(),
    allowResubmit: z.boolean().optional(),
    availableFrom: timestamp.nullable().optional(),
    dueDate: timestamp.optional(),
    expectedContentRevision: z.number().int().min(1),
  })
  .strict()
  .refine((value) => Object.keys(value).some((key) => key !== 'expectedContentRevision'), {
    message: 'At least one mutable Assignment field is required',
  });

export const changeAssignmentStatusSchema = z
  .object({
    status: z.enum(ASSIGNMENT_STATUSES),
    scheduledPublishAt: timestamp.nullable().default(null),
    reason: z.string().trim().min(5).max(500),
    expectedContentRevision: z.number().int().min(1),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === 'SCHEDULED' && !value.scheduledPublishAt)
      context.addIssue({
        code: 'custom',
        path: ['scheduledPublishAt'],
        message: 'scheduledPublishAt is required for SCHEDULED status',
      });
    if (value.status !== 'SCHEDULED' && value.scheduledPublishAt)
      context.addIssue({
        code: 'custom',
        path: ['scheduledPublishAt'],
        message: 'scheduledPublishAt is only allowed for SCHEDULED status',
      });
  });

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type ChangeAssignmentStatusInput = z.infer<typeof changeAssignmentStatusSchema>;
export type AssignmentListQueryInput = z.infer<typeof assignmentListQuerySchema>;
