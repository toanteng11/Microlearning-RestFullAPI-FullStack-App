export const LEARNING_ACTIVITY_DESCRIPTOR_VERSION = 'P05_ACTIVITY_DESCRIPTOR_V2' as const;
export const LEARNING_ACTIVITY_TYPES = ['LESSON', 'QUIZ', 'ASSIGNMENT'] as const;
export type LearningActivityType = (typeof LEARNING_ACTIVITY_TYPES)[number];

export interface ActivityKey {
  activityType: LearningActivityType;
  activityId: string;
}

export interface LearningActivityDescriptor {
  activityType: LearningActivityType;
  activityId: string;
  classroomId: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  isRequired: boolean;
  completionDeadline: string;
  displayOrder: number;
  visible: boolean;
  actionUrl: string;
}

export interface LearningActivityReader {
  readonly descriptorVersion: typeof LEARNING_ACTIVITY_DESCRIPTOR_VERSION;
  listByCourseIds(
    courseIds: readonly string[],
    asOf: Date,
  ): Promise<ReadonlyMap<string, readonly LearningActivityDescriptor[]>>;
}
