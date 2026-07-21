import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { resolveEffectiveContentStatus } from '../learning-content/content-schedule.policy.js';
import type { CourseGovernanceRow, CourseRepository } from './course.repository.js';
import type { AdminCourseListQueryInput } from './course-governance.schemas.js';

function objectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
  }
  return new Types.ObjectId(value);
}

function assertGovernanceActor(actor: AuthenticatedUser): void {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }
}

function paginationMeta(page: number, limit: number, totalItems: number) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

function governanceDto(row: CourseGovernanceRow, asOf: Date) {
  return {
    id: row.course._id.toString(),
    title: row.course.title,
    status: row.course.status,
    effectiveStatus: resolveEffectiveContentStatus(row.course, asOf),
    scheduledPublishAt: row.course.scheduledPublishAt?.toISOString() ?? null,
    publishedAt: row.course.publishedAt?.toISOString() ?? null,
    archivedAt: row.course.archivedAt?.toISOString() ?? null,
    classroom: {
      id: row.classroom._id.toString(),
      name: row.classroom.name,
      status: row.classroom.status,
    },
    owner: { id: row.owner._id.toString(), fullName: row.owner.fullName },
    moduleCount: row.moduleCount,
    lessonCount: row.lessonCount,
    createdAt: row.course.createdAt.toISOString(),
    updatedAt: row.course.updatedAt.toISOString(),
  };
}

export class CourseGovernanceService {
  constructor(
    private readonly courses: CourseRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(actor: AuthenticatedUser, query: AdminCourseListQueryInput) {
    assertGovernanceActor(actor);
    const result = await this.courses.listGovernance({
      ...query,
      classroomId: query.classroomId ? objectId(query.classroomId) : undefined,
      ownerTeacherId: query.ownerTeacherId ? objectId(query.ownerTeacherId) : undefined,
    });
    const asOf = this.now();
    return {
      data: {
        items: result.items.map((item) => governanceDto(item, asOf)),
        asOf: asOf.toISOString(),
      },
      meta: paginationMeta(query.page, query.limit, result.totalItems),
    };
  }

  async detail(actor: AuthenticatedUser, courseId: string) {
    assertGovernanceActor(actor);
    const row = await this.courses.findGovernanceById(objectId(courseId));
    if (!row) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    const asOf = this.now();
    return { ...governanceDto(row, asOf), asOf: asOf.toISOString() };
  }
}
