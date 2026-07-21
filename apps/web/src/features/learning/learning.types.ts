import type { Pagination } from '../classrooms/classroom.types';

export type ContentStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
export type DerivedLearningStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'MISSING' | 'COMPLETED' | 'LATE';

export interface LearningProgress {
  status: 'IN_PROGRESS' | 'COMPLETED' | null;
  startedAt: string | null;
  completedAt: string | null;
  lastActiveAt: string | null;
  derivedStatus: DerivedLearningStatus;
}

export interface StudentLessonSummary {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  contentHtml: string;
  contentFormat: 'MARKDOWN';
  estimatedMinutes: number;
  isRequired: boolean;
  completionDeadline: string | null;
  displayOrder: number;
  publishedRevision: number;
}

export interface ClassworkLesson extends StudentLessonSummary {
  progress: LearningProgress;
}

export interface ClassworkModule {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
  lessons: ClassworkLesson[];
}

export interface ClassworkCourse {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
  lessons: ClassworkLesson[];
  modules: ClassworkModule[];
}

export interface StudentClassworkEnvelope {
  success: true;
  data: {
    classroom: { id: string; name: string };
    courses: ClassworkCourse[];
    asOf: string;
  };
}

export interface StudentAnnouncement {
  id: string;
  classroomId: string;
  teacherId: string;
  contentHtml: string;
  publishedAt: string | null;
}

export interface TeacherAnnouncement extends StudentAnnouncement {
  content: string;
  status: ContentStatus;
  effectiveStatus: ContentStatus;
  scheduledPublishAt: string | null;
  unpublishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  allowedActions: string[];
}

export interface ItemEnvelope<T> {
  success: true;
  data: { items: T[]; asOf?: string };
  meta: Pagination;
}

export interface TeacherCourse {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  status: ContentStatus;
  effectiveStatus: ContentStatus;
  scheduledPublishAt: string | null;
  publishedAt: string | null;
  unpublishedAt: string | null;
  archivedAt: string | null;
  displayOrder: number;
  structureRevision: number;
  createdAt: string;
  updatedAt: string;
  allowedActions: string[];
}

export interface TodoItem {
  id: string;
  title: string;
  classroom: { id: string; name: string };
  course: { id: string; title: string };
  module?: { id: string; title: string } | null;
  completionDeadline: string;
  progress: LearningProgress;
  actionUrl: string;
}

export interface TodoEnvelope {
  success: true;
  data: { items: TodoItem[]; scopeVersion?: string; asOf: string };
  meta: Pagination;
}

export interface Flashcard {
  id: string;
  lessonId: string;
  frontHtml: string;
  backHtml: string;
  displayOrder: number;
}

export interface LessonNavigationLink {
  id?: string;
  label?: string;
  title?: string;
  url: string;
}

export interface StudentLessonPlayerEnvelope {
  success: true;
  data: {
    lesson: StudentLessonSummary & { progress: LearningProgress; flashcards: Flashcard[] };
    navigation: {
      back: LessonNavigationLink;
      previous: LessonNavigationLink | null;
      next: LessonNavigationLink | null;
      breadcrumb: Array<{ label: string; url: string }>;
    };
    asOf: string;
  };
}

export interface CourseDashboard {
  metricVersion: 'P04_LESSON_COMPLETION_V1';
  asOf: string;
  course: { id: string; title: string; classroomId: string; classroomName: string };
  summary: {
    totalLessons: number;
    publishedLessons: number;
    requiredLessons: number;
    activeStudents: number;
    averageProgressPercentage: number;
  };
  activities: Array<{
    id: string;
    title: string;
    isRequired: boolean;
    completionDeadline: string | null;
    deadlineStatus: 'NO_DEADLINE' | 'UPCOMING' | 'OVERDUE';
    completedStudents: number;
    activeStudents: number;
    completionPercentage: number;
  }>;
  students: RankedStudent[];
}

export interface RankedStudent {
  rank?: number;
  id: string;
  fullName: string;
  email: string;
  studentCode: string | null;
  requiredLessons: number;
  completedLessons: number;
  progressPercentage: number;
  progressStatus: DerivedLearningStatus;
  lastActiveAt: string | null;
}

export interface CourseGovernanceSummary {
  id: string;
  title: string;
  status: ContentStatus;
  effectiveStatus: ContentStatus;
  scheduledPublishAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  classroom: { id: string; name: string; status: string };
  owner: { id: string; fullName: string };
  moduleCount: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
  asOf?: string;
}
