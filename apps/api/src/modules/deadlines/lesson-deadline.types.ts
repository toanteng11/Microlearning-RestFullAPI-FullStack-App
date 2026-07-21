import type { Types } from 'mongoose';

export interface NewLessonDeadlineChange {
  lessonId: Types.ObjectId;
  courseId: Types.ObjectId;
  classroomId: Types.ObjectId;
  fromDeadline: Date | null;
  toDeadline: Date | null;
  fromRevision: number;
  toRevision: number;
  reason?: string | null;
  actorId: Types.ObjectId;
  requestId: string;
  changedAt: Date;
}
