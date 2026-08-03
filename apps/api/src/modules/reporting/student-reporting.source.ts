export interface StudentReportingCourseScope {
  classroomId: string;
  classroomName: string;
  courseId: string;
  courseTitle: string;
}

export interface StudentReturnedGradeSummary {
  gradeId: string;
  activityId: string;
  activityType: 'QUIZ' | 'ASSIGNMENT';
  activityTitle: string;
  score: number;
  maxScore: number;
  normalizedScore: number;
  returnedAt: Date;
  actionUrl: string;
}

export interface StudentReportingSource {
  listActiveCourses(
    studentId: string,
    asOf: Date,
  ): Promise<{
    activeClassroomCount: number;
    courses: readonly StudentReportingCourseScope[];
  }>;
  listRecentReturnedGrades(
    studentId: string,
    limit: number,
  ): Promise<readonly StudentReturnedGradeSummary[]>;
}
