import { randomUUID } from 'node:crypto';

import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { AnalyticsEventInput, AdminAdoptionQuery } from './reporting.schemas.js';
import type { ReportingScopeReader } from './reporting-scope.reader.js';
import { AnalyticsEventRepository } from './analytics-event.repository.js';
import { ANALYTICS_EVENT_SCHEMA_VERSION } from './reporting.constants.js';
import { normalizeReportingDateRange } from './reporting-date-range.js';
import { protectSensitiveAggregate } from './reporting-privacy.policy.js';
import { toReportMetadataDto } from './reporting.dto.js';

const MAX_EVENT_AGE_MS = 7 * 86_400_000;
const MAX_FUTURE_SKEW_MS = 5 * 60_000;

interface AnalyticsEventOptions {
  enabled: boolean;
  retentionDays: number;
  environment: string;
  appVersion: string;
  timezone: string;
  maxDateRangeDays: number;
  privacyMinGroupSize: number;
  staleAfterSeconds: number;
}

export class AnalyticsEventService {
  constructor(
    private readonly repository: AnalyticsEventRepository,
    private readonly scopes: ReportingScopeReader,
    private readonly options: AnalyticsEventOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private assertEnabled() {
    if (!this.options.enabled) {
      throw new AppError(409, 'FEATURE_NOT_ENABLED', 'Analytics events are not enabled');
    }
  }

  private async assertContext(actor: AuthenticatedUser, input: AnalyticsEventInput) {
    const { courseId, classroomId } = input.context;
    if (!courseId) return;
    if (actor.role === 'STUDENT') {
      const scope = await this.scopes.requireStudentCourse(actor.id, courseId);
      if (classroomId && classroomId !== scope.classroomId) {
        throw new AppError(403, 'ACCESS_DENIED', 'Analytics context is outside actor scope');
      }
      return;
    }
    if (actor.role === 'TEACHER') {
      const scope = await this.scopes.requireTeacherCourse(actor.id, courseId);
      if (classroomId && classroomId !== scope.classroomId) {
        throw new AppError(403, 'ACCESS_DENIED', 'Analytics context is outside actor scope');
      }
      return;
    }
    if (input.context.activityId || input.context.activityType) {
      throw new AppError(403, 'ACCESS_DENIED', 'Admin analytics cannot include activity context');
    }
  }

  async ingest(actor: AuthenticatedUser, input: AnalyticsEventInput) {
    this.assertEnabled();
    const receivedAt = this.now();
    const occurredAt = new Date(input.occurredAt);
    if (
      occurredAt.getTime() < receivedAt.getTime() - MAX_EVENT_AGE_MS ||
      occurredAt.getTime() > receivedAt.getTime() + MAX_FUTURE_SKEW_MS
    ) {
      throw new AppError(
        422,
        'ANALYTICS_EVENT_TIME_INVALID',
        'Analytics event time is outside the accepted window',
      );
    }
    await this.assertContext(actor, input);
    const context = {
      ...(input.context.classroomId
        ? { classroomId: new Types.ObjectId(input.context.classroomId) }
        : {}),
      ...(input.context.courseId ? { courseId: new Types.ObjectId(input.context.courseId) } : {}),
      ...(input.context.activityType ? { activityType: input.context.activityType } : {}),
      ...(input.context.activityId
        ? { activityId: new Types.ObjectId(input.context.activityId) }
        : {}),
    };
    try {
      const result = await this.repository.create({
        eventId: input.eventId,
        eventName: input.eventName,
        schemaVersion: ANALYTICS_EVENT_SCHEMA_VERSION,
        actorId: new Types.ObjectId(actor.id),
        actorRole: actor.role,
        context,
        properties: input.properties,
        occurredAt,
        receivedAt,
        expiresAt: new Date(receivedAt.getTime() + this.options.retentionDays * 86_400_000),
        environment: this.options.environment,
        appVersion: this.options.appVersion,
      });
      return { accepted: true, stored: true, duplicate: result === 'DUPLICATE' };
    } catch {
      return { accepted: true, stored: false, duplicate: false };
    }
  }

  async adoption(actor: AuthenticatedUser, query: AdminAdoptionQuery) {
    this.assertEnabled();
    if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
    }
    const asOf = this.now();
    const range = normalizeReportingDateRange(query, {
      timezone: this.options.timezone,
      maxDateRangeDays: this.options.maxDateRangeDays,
      now: asOf,
    });
    const rows = await this.repository.aggregateAdoption({ ...range, interval: query.interval });
    const items = rows.map((row) => {
      const protectedCount = protectSensitiveAggregate(
        row.distinctActorCount,
        row.eventCount,
        this.options.privacyMinGroupSize,
      );
      return {
        periodStart: row.periodStart.toISOString(),
        eventName: row.eventName,
        actorRole: row.actorRole,
        eventCount: protectedCount.value,
        distinctActorCountBucket: protectedCount.dataSuppressed
          ? `<${this.options.privacyMinGroupSize}`
          : row.distinctActorCount >= 50
            ? '50+'
            : row.distinctActorCount >= 20
              ? '20-49'
              : row.distinctActorCount >= 10
                ? '10-19'
                : '5-9',
        dataState: protectedCount.dataState,
        suppressionReason: protectedCount.suppressionReason,
      };
    });
    return {
      items,
      reporting: toReportMetadataDto({
        reportId: randomUUID(),
        definitionVersion: 'P06_ANALYTICS_ADOPTION_V1',
        sourceMetricVersion: null,
        descriptorVersion: null,
        dataState:
          items.length === 0
            ? 'NO_DATA'
            : items.every((item) => item.dataState === 'SUPPRESSED')
              ? 'SUPPRESSED'
              : 'READY',
        timezone: range.timezone,
        asOf,
        generatedAt: this.now(),
        freshness: {
          status: 'FRESH',
          recalculatedAt: asOf,
          sourceChangedAt: rows.at(-1)?.periodStart ?? null,
          staleAfterSeconds: this.options.staleAfterSeconds,
          failedItemsCount: 0,
        },
        filters: {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          timezone: range.timezone,
          interval: query.interval,
        },
      }),
    };
  }
}
