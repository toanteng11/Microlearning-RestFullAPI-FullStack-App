import type { Types } from 'mongoose';

export const CLASSROOM_STATUSES = ['ACTIVE', 'LOCKED', 'ARCHIVED'] as const;
export type ClassroomStatus = (typeof CLASSROOM_STATUSES)[number];

export const CLASSROOM_ENROLLMENT_STATUSES = ['OPEN', 'CLOSED', 'LOCKED'] as const;
export type ClassroomEnrollmentStatus = (typeof CLASSROOM_ENROLLMENT_STATUSES)[number];

export const CLASSROOM_SORT_FIELDS = ['name', 'status', 'createdAt', 'updatedAt'] as const;
export type ClassroomSortField = (typeof CLASSROOM_SORT_FIELDS)[number];

export interface NewClassroom {
  name: string;
  description?: string | null;
  subject?: string | null;
  section?: string | null;
  ownerTeacherId: Types.ObjectId;
  status?: ClassroomStatus;
  enrollmentStatus?: ClassroomEnrollmentStatus;
  allowClassCodeJoin?: boolean;
  allowInviteLinkJoin?: boolean;
}

export interface ClassroomListQuery {
  page: number;
  limit: number;
  keyword?: string;
  status?: ClassroomStatus;
  enrollmentStatus?: ClassroomEnrollmentStatus;
  sortBy: ClassroomSortField;
  sortOrder: 'asc' | 'desc';
}

export interface StudentClassroomListQuery {
  page: number;
  limit: number;
  keyword?: string;
  status?: ClassroomStatus;
  sortBy: 'name' | 'joinedAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface AdminClassroomListQuery extends ClassroomListQuery {
  ownerTeacherId?: Types.ObjectId;
}

export interface ClassroomUpdateCommand {
  classroomId: Types.ObjectId;
  ownerTeacherId: Types.ObjectId;
  expectedUpdatedAt: Date;
  patch: Partial<
    Pick<
      NewClassroom,
      | 'name'
      | 'description'
      | 'subject'
      | 'section'
      | 'enrollmentStatus'
      | 'allowClassCodeJoin'
      | 'allowInviteLinkJoin'
    >
  >;
}

export function normalizeClassroomDisplayName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}
