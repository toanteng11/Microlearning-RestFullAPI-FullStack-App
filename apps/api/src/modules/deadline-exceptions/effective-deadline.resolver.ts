import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { ActivityKey } from '../learning-content/learning-activity.reader.js';
import type { DeadlineExceptionRepository } from './deadline-exception.repository.js';

export interface EffectiveDeadline {
  defaultDeadline: Date;
  effectiveDeadline: Date;
  source: 'DEFAULT' | 'STUDENT_EXCEPTION';
  exceptionRevision: number | null;
}

export interface ActivityDeadlineReader {
  getDefaultDeadline(activity: ActivityKey): Promise<Date | null>;
}

export function resolveEffectiveDeadline(
  defaultDeadline: Date,
  exception: { active: boolean; deadline: Date; revision: number } | null | undefined,
): EffectiveDeadline {
  if (!exception?.active) {
    return {
      defaultDeadline,
      effectiveDeadline: defaultDeadline,
      source: 'DEFAULT',
      exceptionRevision: null,
    };
  }
  return {
    defaultDeadline,
    effectiveDeadline: exception.deadline,
    source: 'STUDENT_EXCEPTION',
    exceptionRevision: exception.revision,
  };
}

function keyOf(activity: ActivityKey): string {
  return `${activity.activityType}:${activity.activityId}`;
}

function objectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  }
  return new Types.ObjectId(value);
}

export class EffectiveDeadlineResolver {
  constructor(
    private readonly deadlines: ActivityDeadlineReader,
    private readonly exceptions: DeadlineExceptionRepository,
  ) {}

  async resolve(activity: ActivityKey, studentId: string): Promise<EffectiveDeadline> {
    const defaultDeadline = await this.deadlines.getDefaultDeadline(activity);
    if (!defaultDeadline) {
      throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Published activity has no deadline');
    }
    const exception = await this.exceptions.findCurrent(
      objectId(studentId, 'Student'),
      activity.activityType,
      objectId(activity.activityId, 'Activity'),
    );
    return resolveEffectiveDeadline(defaultDeadline, exception);
  }

  async resolveMany(
    activities: readonly ActivityKey[],
    studentId: string,
  ): Promise<ReadonlyMap<string, EffectiveDeadline>> {
    const entries = await Promise.all(
      activities.map(
        async (activity) => [keyOf(activity), await this.resolve(activity, studentId)] as const,
      ),
    );
    return new Map(entries);
  }
}
