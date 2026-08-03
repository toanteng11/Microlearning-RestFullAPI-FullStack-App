import { CourseProgressSummaryModel } from './course-progress-summary.model.js';
import type { CommonContentStatus } from '../learning-content/content.types.js';

export interface AdminLearningOutcomeAggregate {
  courseId: string;
  courseTitle: string;
  courseStatus: CommonContentStatus;
  studentCount: number;
  averageProgressPercentage: number | null;
  completedStudentCount: number;
  gradePointsEarned: number;
  gradePointsPossible: number;
  missingActivityCount: number;
  lateActivityCount: number;
  sourceChangedAt: Date;
}

export class AdminLearningOutcomeRepository {
  aggregate(input: {
    from: Date;
    to: Date;
    courseStatus?: CommonContentStatus;
  }): Promise<AdminLearningOutcomeAggregate[]> {
    return CourseProgressSummaryModel.aggregate<AdminLearningOutcomeAggregate>([
      { $match: { recalculatedAt: { $gte: input.from, $lt: input.to } } },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
          pipeline: [{ $project: { title: 1, status: 1 } }],
        },
      },
      { $unwind: '$course' },
      ...(input.courseStatus ? [{ $match: { 'course.status': input.courseStatus } }] : []),
      {
        $group: {
          _id: '$courseId',
          courseTitle: { $first: '$course.title' },
          courseStatus: { $first: '$course.status' },
          studentCount: { $sum: 1 },
          averageProgressPercentage: { $avg: '$progressPercentage' },
          completedStudentCount: { $sum: { $cond: ['$courseCompleted', 1, 0] } },
          gradePointsEarned: { $sum: '$gradePointsEarned' },
          gradePointsPossible: { $sum: '$gradePointsPossible' },
          missingActivityCount: { $sum: '$missingActivityCount' },
          lateActivityCount: { $sum: '$lateActivityCount' },
          sourceChangedAt: { $max: '$sourceChangedAt' },
        },
      },
      {
        $project: {
          _id: 0,
          courseId: { $toString: '$_id' },
          courseTitle: 1,
          courseStatus: 1,
          studentCount: 1,
          averageProgressPercentage: 1,
          completedStudentCount: 1,
          gradePointsEarned: 1,
          gradePointsPossible: 1,
          missingActivityCount: 1,
          lateActivityCount: 1,
          sourceChangedAt: 1,
        },
      },
      { $sort: { courseTitle: 1, courseId: 1 } },
    ]).exec();
  }
}
