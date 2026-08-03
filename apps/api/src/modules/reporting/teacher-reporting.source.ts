export interface TeacherReportingStudentProfile {
  id: string;
  fullName: string;
  email: string;
  studentCode: string | null;
}

export interface TeacherQuizAttemptState {
  studentId: string;
  activityId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT' | 'NEEDS_REVIEW' | 'GRADED' | 'RESULT_RELEASED';
  submittedAt: Date | null;
}

export interface TeacherAssignmentSubmissionState {
  studentId: string;
  activityId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED';
  submittedAt: Date | null;
  isLate: boolean;
}

export interface TeacherAssessmentStates {
  quizAttempts: readonly TeacherQuizAttemptState[];
  assignmentSubmissions: readonly TeacherAssignmentSubmissionState[];
}

export interface TeacherReportingSource {
  listStudentProfiles(
    studentIds: readonly string[],
  ): Promise<readonly TeacherReportingStudentProfile[]>;
  listAssessmentStates(
    courseId: string,
    studentIds: readonly string[],
  ): Promise<TeacherAssessmentStates>;
}
