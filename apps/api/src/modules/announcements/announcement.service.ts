import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import type { PhaseFourAuditWriter } from '../audit/phase-four-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { ClassroomScopeReader } from '../learning-content/classroom-scope.reader.js';
import { assertFutureSchedule } from '../learning-content/content-schedule.policy.js';
import { assertContentTransition } from '../learning-content/content-lifecycle.policy.js';
import {
  toAnnouncementAuditValue,
  toStudentAnnouncementDto,
  toTeacherAnnouncementDto,
} from './announcement.dto.js';
import type { AnnouncementRepository } from './announcement.repository.js';
import type {
  AnnouncementListQueryInput,
  ArchiveAnnouncementInput,
  ChangeAnnouncementStatusInput,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from './announcement.schemas.js';

function objectId(value: string, label = 'Resource'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  }
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function expectedDate(actual: Date, expected: string): Date {
  const value = new Date(expected);
  if (actual.getTime() !== value.getTime()) {
    throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Announcement was modified');
  }
  return value;
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

export class AnnouncementService {
  constructor(
    private readonly announcements: AnnouncementRepository,
    private readonly classroomScopes: ClassroomScopeReader,
    private readonly audits: PhaseFourAuditWriter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireTeacherAnnouncement(actor: AuthenticatedUser, announcementId: string) {
    assertTeacher(actor);
    const announcement = await this.announcements.findAuthoringById(
      objectId(announcementId, 'Announcement'),
    );
    if (!announcement) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Announcement was not found');
    }
    const scope = await this.classroomScopes.getTeacherOwnedScope(
      actor.id,
      announcement.classroomId.toString(),
    );
    return { announcement, scope };
  }

  async list(actor: AuthenticatedUser, classroomId: string, query: AnnouncementListQueryInput) {
    const asOf = this.now();
    const id = objectId(classroomId, 'Classroom');
    if (actor.role === 'TEACHER') {
      await this.classroomScopes.getTeacherOwnedScope(actor.id, classroomId);
      const result = await this.announcements.listByClassroom(id, query);
      return {
        data: {
          items: result.items.map((item) => toTeacherAnnouncementDto(item, actor, asOf)),
          asOf: asOf.toISOString(),
        },
        meta: paginationMeta(result.page, result.limit, result.totalItems),
      };
    }
    if (actor.role === 'STUDENT') {
      const scope = await this.classroomScopes.getStudentEnrollmentScope(actor.id, classroomId);
      if (scope.classroomStatus !== 'ACTIVE') {
        throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Classroom was not found');
      }
      if (query.status) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Student Stream does not accept status filter');
      }
      const result = await this.announcements.listStudentVisibilityCandidates(id, {
        page: query.page,
        limit: query.limit,
        asOf,
      });
      return {
        data: { items: result.items.map(toStudentAnnouncementDto), asOf: asOf.toISOString() },
        meta: paginationMeta(result.page, result.limit, result.totalItems),
      };
    }
    throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
  }

  async create(
    actor: AuthenticatedUser,
    classroomId: string,
    input: CreateAnnouncementInput,
    requestId: string,
  ) {
    assertTeacher(actor);
    const scope = await this.classroomScopes.getTeacherOwnedScope(actor.id, classroomId);
    if (scope.status !== 'ACTIVE') {
      throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Classroom cannot accept Announcement');
    }
    const actorId = objectId(actor.id, 'User');
    return withMongoTransaction(async (session) => {
      const announcement = await this.announcements.create(
        {
          classroomId: objectId(classroomId, 'Classroom'),
          teacherId: actorId,
          content: input.content,
          createdBy: actorId,
          updatedBy: actorId,
        },
        session,
      );
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'ANNOUNCEMENT_CREATED',
          resourceId: announcement._id.toString(),
          requestId,
          newValue: toAnnouncementAuditValue(announcement),
          metadata: { classroomId },
        },
        session,
      );
      return {
        announcement: toTeacherAnnouncementDto(announcement, actor, this.now()),
        auditId: audit._id.toString(),
      };
    });
  }

  async update(
    actor: AuthenticatedUser,
    announcementId: string,
    input: UpdateAnnouncementInput,
    requestId: string,
  ) {
    const { announcement, scope } = await this.requireTeacherAnnouncement(actor, announcementId);
    if (scope.status !== 'ACTIVE' || !['DRAFT', 'UNPUBLISHED'].includes(announcement.status)) {
      throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Announcement content is locked');
    }
    const expectedUpdatedAt = expectedDate(announcement.updatedAt, input.expectedUpdatedAt);
    const actorId = objectId(actor.id, 'User');
    return withMongoTransaction(async (session) => {
      const updated = await this.announcements.updateMetadataCas(
        {
          announcementId: announcement._id,
          expectedUpdatedAt,
          updatedBy: actorId,
          patch: { content: input.content },
        },
        session,
      );
      if (!updated) throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Announcement was modified');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'ANNOUNCEMENT_UPDATED',
          resourceId: announcementId,
          requestId,
          oldValue: toAnnouncementAuditValue(announcement),
          newValue: toAnnouncementAuditValue(updated),
          metadata: { classroomId: scope.classroomId },
        },
        session,
      );
      return {
        announcement: toTeacherAnnouncementDto(updated, actor, this.now()),
        auditId: audit._id.toString(),
      };
    });
  }

  async changeStatus(
    actor: AuthenticatedUser,
    announcementId: string,
    input: ChangeAnnouncementStatusInput,
    requestId: string,
  ) {
    const { announcement, scope } = await this.requireTeacherAnnouncement(actor, announcementId);
    if (scope.status !== 'ACTIVE') {
      throw new AppError(409, 'CONTENT_STATE_CONFLICT', 'Classroom is not active');
    }
    assertContentTransition('COMMON', announcement.status, input.targetStatus);
    const changedAt = this.now();
    const scheduledPublishAt = input.scheduledPublishAt ? new Date(input.scheduledPublishAt) : null;
    if (input.targetStatus === 'SCHEDULED') assertFutureSchedule(scheduledPublishAt, changedAt);
    const expectedUpdatedAt = expectedDate(announcement.updatedAt, input.expectedUpdatedAt);
    const actorId = objectId(actor.id, 'User');
    return withMongoTransaction(async (session) => {
      const updated = await this.announcements.changeStatusCas(
        {
          announcementId: announcement._id,
          expectedUpdatedAt,
          updatedBy: actorId,
          patch: {
            status: input.targetStatus,
            scheduledPublishAt,
            ...(input.targetStatus === 'PUBLISHED' ? { publishedAt: changedAt } : {}),
            ...(input.targetStatus === 'UNPUBLISHED' ? { unpublishedAt: changedAt } : {}),
          },
        },
        session,
      );
      if (!updated) throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Announcement was modified');
      const audit = await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'ANNOUNCEMENT_STATUS_CHANGED',
          resourceId: announcementId,
          requestId,
          oldValue: toAnnouncementAuditValue(announcement),
          newValue: toAnnouncementAuditValue(updated),
          metadata: { classroomId: scope.classroomId },
        },
        session,
      );
      return {
        announcement: toTeacherAnnouncementDto(updated, actor, changedAt),
        auditId: audit._id.toString(),
      };
    });
  }

  async archive(
    actor: AuthenticatedUser,
    announcementId: string,
    input: ArchiveAnnouncementInput,
    requestId: string,
  ) {
    const { announcement, scope } = await this.requireTeacherAnnouncement(actor, announcementId);
    assertContentTransition('COMMON', announcement.status, 'ARCHIVED');
    const expectedUpdatedAt = expectedDate(announcement.updatedAt, input.expectedUpdatedAt);
    const actorId = objectId(actor.id, 'User');
    const archivedAt = this.now();
    await withMongoTransaction(async (session) => {
      const archived = await this.announcements.archiveCas(
        { announcementId: announcement._id, expectedUpdatedAt, actorId, archivedAt },
        session,
      );
      if (!archived)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Announcement was modified');
      await this.audits.append(
        {
          actorId,
          actorRole: actor.role,
          action: 'ANNOUNCEMENT_ARCHIVED',
          resourceId: announcementId,
          requestId,
          reason: input.reason,
          oldValue: toAnnouncementAuditValue(announcement),
          newValue: toAnnouncementAuditValue(archived),
          metadata: { classroomId: scope.classroomId },
        },
        session,
      );
      return true;
    });
  }
}
