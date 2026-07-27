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

export type LearningActivityType = 'LESSON' | 'QUIZ' | 'ASSIGNMENT';

export interface ClassworkActivity {
  id: string;
  activityId: string;
  activityType: LearningActivityType;
  courseId: string;
  moduleId: string | null;
  title: string;
  isRequired: boolean;
  completionDeadline: string;
  defaultDeadline: string;
  effectiveDeadline: string;
  hasDeadlineException: boolean;
  displayOrder: number;
  actionUrl: string;
  progress: LearningProgress;
}

export interface ClassworkModule {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
  activities: ClassworkActivity[];
  lessons: ClassworkLesson[];
}

export interface ClassworkCourse {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
  descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2';
  activities: ClassworkActivity[];
  lessons: ClassworkLesson[];
  modules: ClassworkModule[];
}

export interface StudentClassworkEnvelope {
  success: true;
  data: {
    classroom: { id: string; name: string };
    courses: ClassworkCourse[];
    descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2';
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
  activityId: string;
  activityType: LearningActivityType;
  title: string;
  classroom: { id: string; name: string };
  course: { id: string; title: string };
  module?: { id: string; title: string } | null;
  completionDeadline: string;
  defaultDeadline: string;
  effectiveDeadline: string;
  hasDeadlineException: boolean;
  progress: LearningProgress;
  actionUrl: string;
}

export interface TodoEnvelope {
  success: true;
  data: {
    items: TodoItem[];
    scopeVersion?: 'P05_MIXED_ACTIVITY_TODO_V2';
    descriptorVersion?: 'P05_ACTIVITY_DESCRIPTOR_V2';
    asOf: string;
  };
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
  metricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1';
  descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2';
  asOf: string;
  course: { id: string; title: string; classroomId: string; classroomName: string };
  summary: {
    totalLessons: number;
    publishedLessons: number;
    requiredLessons: number;
    totalActivities: number;
    publishedActivities: number;
    requiredActivities: number;
    activeStudents: number;
    averageProgressPercentage: number;
  };
  activities: Array<{
    id: string;
    activityId: string;
    activityType: LearningActivityType;
    title: string;
    isRequired: boolean;
    completionDeadline: string | null;
    deadlineStatus: 'NO_DEADLINE' | 'UPCOMING' | 'OVERDUE';
    completedStudents: number;
    activeStudents: number;
    completionPercentage: number;
    actionUrl: string;
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
  requiredActivities: number;
  completedActivities: number;
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
  quizCount: number;
  assignmentCount: number;
  createdAt: string;
  updatedAt: string;
  asOf?: string;
}
