export const LEARNING_ACTIVITY_DESCRIPTOR_VERSION = 'P04_ACTIVITY_DESCRIPTOR_V1' as const;

export interface LearningActivityDescriptor {
  activityType: 'LESSON';
  activityId: string;
  classroomId: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  isRequired: boolean;
  completionDeadline: string;
  displayOrder: number;
  visible: boolean;
}

export interface LearningActivityReader {
  readonly descriptorVersion: typeof LEARNING_ACTIVITY_DESCRIPTOR_VERSION;
  listByCourseIds(
    courseIds: readonly string[],
    asOf: Date,
  ): Promise<ReadonlyMap<string, readonly LearningActivityDescriptor[]>>;
}
