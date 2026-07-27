export const ASSESSMENT_SCHEMA_VERSION = 1 as const;
export const SCORING_POLICY_VERSION = 'P05_EXACT_SET_INTEGER_V1' as const;
export const STUDENT_TODO_SCOPE_VERSION = 'P05_MIXED_ACTIVITY_TODO_V2' as const;

export const QUIZ_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED',
] as const;
export type QuizStatus = (typeof QUIZ_STATUSES)[number];

export const ATTEMPT_STATUSES = [
  'IN_PROGRESS',
  'SUBMITTED',
  'TIMED_OUT',
  'NEEDS_REVIEW',
  'GRADED',
  'RESULT_RELEASED',
] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const ASSIGNMENT_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'UNPUBLISHED',
  'CLOSED',
  'ARCHIVED',
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const SUBMISSION_STATUSES = ['DRAFT', 'SUBMITTED', 'LATE', 'GRADED', 'RETURNED'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
export const DERIVED_SUBMISSION_STATUSES = ['ASSIGNED', 'MISSING'] as const;

export const GRADE_STATUSES = ['DRAFT', 'RETURNED'] as const;
export type GradeStatus = (typeof GRADE_STATUSES)[number];

export const QUESTION_TYPES = [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const RESULT_RELEASE_POLICIES = ['IMMEDIATE', 'AFTER_REVIEW', 'TEACHER_RETURN'] as const;
export type ResultReleasePolicy = (typeof RESULT_RELEASE_POLICIES)[number];

export const QUIZ_SCORE_POLICIES = ['HIGHEST'] as const;
export type QuizScorePolicy = (typeof QUIZ_SCORE_POLICIES)[number];
