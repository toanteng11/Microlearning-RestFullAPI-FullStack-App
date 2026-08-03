import { AnalyticsEventModel, type AnalyticsEventRecord } from './analytics-event.model.js';

export type AnalyticsEventCreate = Omit<AnalyticsEventRecord, '_id' | 'createdAt'>;

export interface AnalyticsAdoptionRow {
  periodStart: Date;
  eventName: string;
  actorRole: string;
  eventCount: number;
  distinctActorCount: number;
}

export class AnalyticsEventRepository {
  async create(input: AnalyticsEventCreate) {
    try {
      await new AnalyticsEventModel(input).save();
      return 'STORED' as const;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return 'DUPLICATE' as const;
      throw error;
    }
  }

  aggregateAdoption(input: {
    from: Date;
    to: Date;
    timezone: string;
    interval: 'DAY' | 'WEEK' | 'MONTH';
  }) {
    const unit = input.interval.toLowerCase() as 'day' | 'week' | 'month';
    return AnalyticsEventModel.aggregate<AnalyticsAdoptionRow>([
      { $match: { receivedAt: { $gte: input.from, $lt: input.to } } },
      {
        $group: {
          _id: {
            periodStart: {
              $dateTrunc: { date: '$receivedAt', unit, timezone: input.timezone },
            },
            eventName: '$eventName',
            actorRole: '$actorRole',
          },
          eventCount: { $sum: 1 },
          actorIds: { $addToSet: '$actorId' },
        },
      },
      {
        $project: {
          _id: 0,
          periodStart: '$_id.periodStart',
          eventName: '$_id.eventName',
          actorRole: '$_id.actorRole',
          eventCount: 1,
          distinctActorCount: { $size: '$actorIds' },
        },
      },
      { $sort: { periodStart: 1, eventName: 1, actorRole: 1 } },
    ]).exec();
  }
}
