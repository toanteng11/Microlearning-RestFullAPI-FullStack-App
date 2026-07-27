import type { OpenAPIV3 } from 'openapi-types';

type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
const security: OpenAPIV3.SecurityRequirementObject[] = [{ bearerAuth: [] }];
const content = (schema: Schema, example?: unknown) => ({ 'application/json': { schema, ...(example === undefined ? {} : { example }) } });
const response = (description: string, schema: Schema): OpenAPIV3.ResponseObject => ({ description, content: content(schema) });
const error = (description: string): OpenAPIV3.ResponseObject => response(description, { $ref: '#/components/schemas/ErrorResponse' });
const errors = { '401': error('Authentication required'), '403': error('Permission denied'), '404': error('Resource not found'), '409': error('Lifecycle, policy or revision conflict'), '422': error('Validation failed'), '429': error('Rate limit exceeded') };
const body = (schema: Schema, example: unknown): OpenAPIV3.RequestBodyObject => ({ required: true, content: content(schema, example) });
const id = (name: 'courseId' | 'assignmentId' | 'submissionId'): OpenAPIV3.ParameterObject => ({ name, in: 'path', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } });
const read = { $ref: '#/components/schemas/AssessmentReadResponse' } as const;

export const PHASE_FIVE_ASSIGNMENT_OPENAPI_OPERATIONS = [
  'listTeacherCourseAssignments', 'createAssignment', 'getTeacherAssignment', 'updateAssignment',
  'changeAssignmentStatus', 'previewAssignment', 'listAssignmentSubmissions', 'getTeacherSubmission',
  'getStudentAssignment', 'getOwnAssignmentSubmission', 'saveAssignmentSubmissionDraft',
  'turnInAssignment', 'unsubmitAssignment', 'startAssignmentResubmission', 'listOwnSubmissionHistory',
] as const;

export const phaseFiveAssignmentTags: OpenAPIV3.TagObject[] = [
  { name: 'Assignments', description: 'Teacher Assignment authoring and Student-safe activity detail' },
  { name: 'Submissions', description: 'Revisioned own Submission lifecycle and Teacher roster' },
];

const nullableTimestamp: OpenAPIV3.SchemaObject = { type: 'string', format: 'date-time', nullable: true };
export const phaseFiveAssignmentSchemas: Record<string, Schema> = {
  AssignmentStatus: { type: 'string', enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'CLOSED', 'ARCHIVED'] },
  SubmissionStatus: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'LATE', 'GRADED', 'RETURNED'] },
  AssignmentInput: {
    type: 'object', additionalProperties: false,
    required: ['title', 'instruction', 'maxScore', 'dueDate'],
    properties: {
      moduleId: { type: 'string', nullable: true }, title: { type: 'string', minLength: 2, maxLength: 150 }, instruction: { type: 'string', minLength: 1, maxLength: 100000 },
      maxScore: { type: 'integer', minimum: 1, maximum: 1000 }, isRequired: { type: 'boolean' },
      allowedSubmissionTypes: { type: 'array', items: { type: 'string', enum: ['TEXT', 'LINK', 'MARK_DONE'] } },
      allowLateSubmission: { type: 'boolean' }, allowUnsubmit: { type: 'boolean' }, allowResubmit: { type: 'boolean' },
      availableFrom: nullableTimestamp, dueDate: { type: 'string', format: 'date-time' }, expectedContentRevision: { type: 'integer', minimum: 1 },
    },
  },
  AssignmentStatusRequest: {
    type: 'object', additionalProperties: false, required: ['status', 'reason', 'expectedContentRevision'],
    properties: { status: { $ref: '#/components/schemas/AssignmentStatus' }, scheduledPublishAt: nullableTimestamp, reason: { type: 'string', minLength: 5 }, expectedContentRevision: { type: 'integer', minimum: 1 } },
  },
  SaveSubmissionDraftRequest: {
    type: 'object', additionalProperties: false, required: ['submissionType', 'expectedSubmissionRevision'],
    properties: {
      submissionType: { type: 'string', enum: ['TEXT', 'LINK', 'MARK_DONE'] }, textAnswer: { type: 'string', nullable: true, maxLength: 100000 },
      links: { type: 'array', maxItems: 5, items: { type: 'string', format: 'uri' } }, markDone: { type: 'boolean' }, expectedSubmissionRevision: { type: 'integer', minimum: 0 },
    },
  },
};

export function createPhaseFiveAssignmentPaths(): OpenAPIV3.PathsObject {
  const assignmentExample = { moduleId: null, title: 'Thiết kế REST endpoint', instruction: 'Nộp mô tả API bằng văn bản.', maxScore: 10, isRequired: true, allowedSubmissionTypes: ['TEXT'], allowLateSubmission: true, allowUnsubmit: true, allowResubmit: true, availableFrom: null, dueDate: '2026-08-12T16:59:59.000Z' };
  const transitionBody: OpenAPIV3.SchemaObject = { type: 'object', additionalProperties: false, required: ['expectedSubmissionRevision'], properties: { expectedSubmissionRevision: { type: 'integer', minimum: 1 } } };
  return {
    '/api/v1/teacher/courses/{courseId}/assignments': {
      parameters: [id('courseId')],
      get: { tags: ['Assignments'], summary: 'List owned Course Assignments', operationId: 'listTeacherCourseAssignments', security, responses: { '200': response('Assignment list', read), ...errors } },
      post: { tags: ['Assignments'], summary: 'Create a draft Assignment', operationId: 'createAssignment', security, requestBody: body({ $ref: '#/components/schemas/AssignmentInput' }, assignmentExample), responses: { '201': response('Assignment created', read), ...errors } },
    },
    '/api/v1/teacher/assignments/{assignmentId}': {
      parameters: [id('assignmentId')],
      get: { tags: ['Assignments'], summary: 'Get owned Assignment', operationId: 'getTeacherAssignment', security, responses: { '200': response('Assignment detail', read), ...errors } },
      patch: { tags: ['Assignments'], summary: 'Update editable Assignment', operationId: 'updateAssignment', security, requestBody: body({ $ref: '#/components/schemas/AssignmentInput' }, { title: 'Thiết kế REST endpoint v2', expectedContentRevision: 1 }), responses: { '200': response('Assignment updated', read), ...errors } },
    },
    '/api/v1/teacher/assignments/{assignmentId}/status': { parameters: [id('assignmentId')], patch: { tags: ['Assignments'], summary: 'Change Assignment lifecycle status', operationId: 'changeAssignmentStatus', security, requestBody: body({ $ref: '#/components/schemas/AssignmentStatusRequest' }, { status: 'PUBLISHED', scheduledPublishAt: null, reason: 'Assignment is ready', expectedContentRevision: 1 }), responses: { '200': response('Assignment status changed', read), ...errors } } },
    '/api/v1/teacher/assignments/{assignmentId}/preview': { parameters: [id('assignmentId')], post: { tags: ['Assignments'], summary: 'Preview Student-safe Assignment', operationId: 'previewAssignment', security, requestBody: body({ type: 'object', additionalProperties: false }, {}), responses: { '200': response('Student-safe preview', read), ...errors } } },
    '/api/v1/teacher/assignments/{assignmentId}/submissions': { parameters: [id('assignmentId')], get: { tags: ['Submissions'], summary: 'List derived Assignment roster', operationId: 'listAssignmentSubmissions', security, responses: { '200': response('Derived roster', read), ...errors } } },
    '/api/v1/teacher/submissions/{submissionId}': { parameters: [id('submissionId')], get: { tags: ['Submissions'], summary: 'Get owned Student Submission', operationId: 'getTeacherSubmission', security, responses: { '200': response('Submission detail', read), ...errors } } },
    '/api/v1/students/assignments/{assignmentId}': { parameters: [id('assignmentId')], get: { tags: ['Assignments'], summary: 'Get assigned Assignment', operationId: 'getStudentAssignment', security, responses: { '200': response('Student Assignment', read), ...errors } } },
    '/api/v1/students/assignments/{assignmentId}/submission': {
      parameters: [id('assignmentId')],
      get: { tags: ['Submissions'], summary: 'Get own current Submission', operationId: 'getOwnAssignmentSubmission', security, responses: { '200': response('Own Submission or null', read), ...errors } },
      put: { tags: ['Submissions'], summary: 'Create or save own Submission draft', operationId: 'saveAssignmentSubmissionDraft', security, requestBody: body({ $ref: '#/components/schemas/SaveSubmissionDraftRequest' }, { submissionType: 'TEXT', textAnswer: 'POST /api/v1/books', links: [], markDone: false, expectedSubmissionRevision: 0 }), responses: { '200': response('Canonical draft', read), ...errors } },
    },
    '/api/v1/students/submissions/{submissionId}/turn-in': { parameters: [id('submissionId')], post: { tags: ['Submissions'], summary: 'Turn in own Submission', operationId: 'turnInAssignment', security, requestBody: body(transitionBody, { expectedSubmissionRevision: 1 }), responses: { '200': response('Turned-in Submission', read), ...errors } } },
    '/api/v1/students/submissions/{submissionId}/unsubmit': { parameters: [id('submissionId')], post: { tags: ['Submissions'], summary: 'Unsubmit own work when allowed', operationId: 'unsubmitAssignment', security, requestBody: body(transitionBody, { expectedSubmissionRevision: 2 }), responses: { '200': response('Editable Submission draft', read), ...errors } } },
    '/api/v1/students/submissions/{submissionId}/resubmit': { parameters: [id('submissionId')], post: { tags: ['Submissions'], summary: 'Start a revisioned resubmission', operationId: 'startAssignmentResubmission', security, requestBody: body({ type: 'object', additionalProperties: false, required: ['reason', 'expectedSubmissionRevision'], properties: { reason: { type: 'string', minLength: 5 }, expectedSubmissionRevision: { type: 'integer', minimum: 1 } } }, { reason: 'Cập nhật bài làm', expectedSubmissionRevision: 2 }), responses: { '200': response('Resubmission draft', read), ...errors } } },
    '/api/v1/students/submissions/{submissionId}/history': { parameters: [id('submissionId')], get: { tags: ['Submissions'], summary: 'List own immutable Submission history', operationId: 'listOwnSubmissionHistory', security, responses: { '200': response('Own Submission history', read), ...errors } } },
  };
}
