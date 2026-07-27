export type QuizStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';

export interface TeacherQuiz {
  id: string;
  classroomId: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  instruction: string;
  isRequired: boolean;
  status: QuizStatus;
  effectiveStatus: QuizStatus;
  availableFrom: string | null;
  dueDate: string;
  attemptLimit: number;
  timeLimitMinutes: number | null;
  resultReleasePolicy: 'IMMEDIATE' | 'AFTER_REVIEW' | 'TEACHER_RETURN';
  scorePolicy: 'HIGHEST';
  displayOrder: number;
  contentRevision: number;
  questionRevision: number;
  publishedRevision: number | null;
  maxScore: number;
  scheduledPublishAt: string | null;
  publishedAt: string | null;
  unpublishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  allowedActions: string[];
}

export interface QuestionOption {
  id: string;
  label: string;
  displayOrder: number;
}

export interface QuestionMedia {
  kind: 'IMAGE_URL' | 'VIDEO_URL';
  url: string;
  provider: string | null;
  caption: string | null;
  altText: string | null;
}

export interface TeacherQuestion {
  id: string;
  quizId: string;
  type: QuestionType;
  prompt: string;
  points: number;
  isRequired: boolean;
  options: QuestionOption[];
  correctOptionIds: string[];
  correctBoolean: boolean | null;
  rubric: string | null;
  explanation: string | null;
  media: QuestionMedia | null;
  displayOrder: number;
  version: number;
  status: 'ACTIVE' | 'ARCHIVED';
  allowedActions: string[];
}

export interface StudentPreviewQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  isRequired: boolean;
  options: QuestionOption[];
  media: QuestionMedia | null;
  displayOrder: number;
}

export interface QuizListEnvelope {
  success: true;
  data: { items: TeacherQuiz[] };
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface QuestionListEnvelope {
  success: true;
  data: { items: TeacherQuestion[]; questionRevision: number; maxScore: number };
}

export interface QuestionMutationEnvelope {
  success: true;
  data: { question: TeacherQuestion; questionRevision: number; maxScore: number; auditId: string };
}

export type AttemptStatus =
  'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT' | 'NEEDS_REVIEW' | 'GRADED' | 'RESULT_RELEASED';

export interface StudentQuizIntro {
  id: string;
  courseId: string;
  classroomId: string;
  title: string;
  instruction: string;
  attemptLimit: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  timeLimitMinutes: number | null;
  effectiveDeadline: string;
  resultReleasePolicy: 'IMMEDIATE' | 'AFTER_REVIEW' | 'TEACHER_RETURN';
  canStart: boolean;
  unavailableReason: string | null;
  activeAttemptId: string | null;
}

export interface StudentAttemptAnswer {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
  savedAt: string;
}

export interface StudentQuizAttempt {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: AttemptStatus;
  quiz: {
    title: string;
    resultReleasePolicy: StudentQuizIntro['resultReleasePolicy'];
    maxScore: number;
    timeLimitMinutes: number | null;
  };
  questions: Array<Omit<StudentPreviewQuestion, 'id'> & { questionId: string }>;
  answers: StudentAttemptAnswer[];
  startedAt: string;
  expiresAt: string;
  lastSavedAt: string | null;
  submittedAt: string | null;
  attemptRevision: number;
  progress: { answeredCount: number; totalCount: number };
  resultPending: boolean;
  result: {
    score: number;
    maxScore: number;
    gradedAt: string | null;
    releasedAt: string | null;
  } | null;
}

export interface StudentQuizResult {
  attemptId: string;
  quizId: string;
  title: string;
  attemptNumber: number;
  status: AttemptStatus;
  submittedAt: string | null;
  resultPending: boolean;
  result: {
    score: number;
    maxScore: number;
    gradedAt: string | null;
    releasedAt: string | null;
  } | null;
}

export type AssignmentStatus =
  'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED' | 'CLOSED' | 'ARCHIVED';
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED';

export interface TeacherAssignment {
  id: string;
  classroomId: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  instruction: string;
  maxScore: number;
  isRequired: boolean;
  allowedSubmissionTypes: Array<'TEXT' | 'LINK' | 'MARK_DONE'>;
  allowLateSubmission: boolean;
  allowUnsubmit: boolean;
  allowResubmit: boolean;
  availableFrom: string | null;
  dueDate: string;
  status: AssignmentStatus;
  effectiveStatus: AssignmentStatus;
  contentRevision: number;
  publishedRevision: number | null;
  scheduledPublishAt: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  allowedActions: string[];
}

export interface StudentAssignment {
  id: string;
  classroomId: string;
  courseId: string;
  title: string;
  instruction: string;
  maxScore: number;
  isRequired: boolean;
  allowedSubmissionTypes: Array<'TEXT' | 'LINK' | 'MARK_DONE'>;
  allowLateSubmission: boolean;
  allowUnsubmit: boolean;
  allowResubmit: boolean;
  effectiveDeadline: string;
  status: 'PUBLISHED';
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  status: SubmissionStatus;
  submissionType: 'TEXT' | 'LINK' | 'MARK_DONE' | null;
  textAnswer: string | null;
  links: string[];
  markDone: boolean;
  revision: number;
  submittedAt: string | null;
  isLate: boolean;
}

export interface AssignmentListEnvelope {
  success: true;
  data: { items: TeacherAssignment[] };
  meta: QuizListEnvelope['meta'];
}

export interface TeacherGrade {
  id: string;
  studentId: string;
  classroomId: string;
  courseId: string;
  activityType: 'QUIZ' | 'ASSIGNMENT';
  activityId: string;
  evidenceType: 'ATTEMPT' | 'SUBMISSION';
  evidenceId: string;
  evidenceRevision: number;
  score: number;
  maxScore: number;
  feedback: string | null;
  status: 'DRAFT' | 'RETURNED';
  revision: number;
  gradedAt: string;
  returnedAt: string | null;
}

export interface TeacherQuizResultRow {
  attemptId: string;
  attemptNumber: number;
  status: AttemptStatus;
  score: number | null;
  maxScore: number;
  submittedAt: string | null;
  reviewRevision: number;
  student: {
    id: string;
    fullName: string;
    email: string;
    studentCode: string | null;
  };
}

export interface TeacherQuizResultsEnvelope {
  success: true;
  data: { items: TeacherQuizResultRow[] };
  meta: QuizListEnvelope['meta'];
  summary: { totalAttempts: number; needsReview: number; released: number };
}

export interface TeacherAttemptReview {
  id: string;
  quizId: string;
  studentId: string;
  classroomId: string;
  courseId: string;
  attemptNumber: number;
  status: AttemptStatus;
  title: string;
  objectiveScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
  attemptRevision: number;
  reviewRevision: number;
  submittedAt: string | null;
  gradedAt: string | null;
  releasedAt: string | null;
  questions: Array<{
    questionId: string;
    type: QuestionType;
    prompt: string;
    points: number;
    rubric: string | null;
    answer: {
      selectedOptionIds: string[];
      textAnswer: string | null;
      savedAt: string;
    } | null;
    review: {
      awardedPoints: number;
      feedback: string | null;
      reviewedAt: string;
    } | null;
  }>;
}

export interface TeacherSubmissionDetail extends StudentSubmission {
  studentId: string;
  classroomId: string;
  courseId: string;
  submittedRevision: number | null;
  effectiveDeadlineAtSubmit: string | null;
  gradedAt: string | null;
  returnedAt: string | null;
  grade: TeacherGrade | null;
}

export interface StudentGrade {
  id: string;
  activityType: 'QUIZ' | 'ASSIGNMENT';
  activityId: string;
  classroomId: string;
  courseId: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string | null;
  revision: number;
  gradedAt: string;
  returnedAt: string | null;
  title: string;
  actionUrl: string;
  evidenceType?: 'ATTEMPT' | 'SUBMISSION';
}

export interface StudentGradesEnvelope {
  success: true;
  data: { items: StudentGrade[] };
  meta: QuizListEnvelope['meta'];
}

export interface DeadlineException {
  id: string;
  studentId: string;
  classroomId: string;
  courseId: string;
  activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
  activityId: string;
  defaultDeadline: string;
  effectiveDeadline: string;
  active: boolean;
  reason: string;
  revision: number;
  changedAt: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    studentCode: string | null;
  } | null;
}

export interface DeadlineExceptionHistory {
  id: string;
  revision: number;
  action: 'SET' | 'REVOKED';
  fromDeadline: string | null;
  toDeadline: string | null;
  reason: string;
  actorRole: string;
  createdAt: string;
}
