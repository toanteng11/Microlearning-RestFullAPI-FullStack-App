export type ClassroomStatus = 'ACTIVE' | 'LOCKED' | 'ARCHIVED';
export type ClassroomEnrollmentStatus = 'OPEN' | 'CLOSED' | 'LOCKED';
export type EnrollmentStatus = 'ACTIVE' | 'REMOVED' | 'LEFT' | 'BLOCKED';

export interface EnrollmentSummary {
  id: string;
  classroomId: string;
  studentId: string;
  status: EnrollmentStatus;
  joinedBy: 'CLASS_CODE' | 'INVITE_LINK';
  joinedAt: string;
  updatedAt: string;
}

export interface ClassroomSettings {
  enrollmentStatus: ClassroomEnrollmentStatus;
  allowClassCodeJoin: boolean;
  allowInviteLinkJoin: boolean;
}

export interface ClassroomSummary {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  section: string | null;
  owner: { id: string; fullName: string };
  status: ClassroomStatus;
  enrollmentStatus: ClassroomEnrollmentStatus;
  membership: EnrollmentSummary | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  contentCount?: number;
}

export interface ClassroomDetail extends ClassroomSummary {
  configuredSettings: ClassroomSettings;
  effectiveSettings: ClassroomSettings;
  allowedActions: string[];
  contentSummary?: {
    classroomId: string;
    courseCount: number;
    lessonCount: number;
    announcementCount: number;
    lastContentUpdatedAt: string | null;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ClassroomListEnvelope {
  success: true;
  data: ClassroomSummary[];
  pagination: Pagination;
  filters: Record<string, unknown>;
}

export interface ClassroomDetailEnvelope {
  success: true;
  data: { classroom: ClassroomDetail };
}

export interface ClassCodeMetadata {
  id: string;
  status: 'ACTIVE' | 'DISABLED' | 'REGENERATED' | 'EXPIRED';
  maskedCode: string;
  generatedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InviteLinkMetadata {
  id: string;
  status: 'ACTIVE' | 'DISABLED' | 'REGENERATED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RosterItem {
  student: {
    id: string;
    fullName: string;
    email: string;
    studentCode: string | null;
    status: string;
  };
  enrollment: EnrollmentSummary;
}

export interface RosterEnvelope {
  success: true;
  data: RosterItem[];
  pagination: Pagination;
  filters: Record<string, unknown>;
}

export interface EnrollmentPolicy {
  allowClassCodeJoin: boolean;
  allowInviteLinkJoin: boolean;
  defaultInviteLinkLifetimeDays: number;
  revision: number;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvitePreview {
  classroomName: string;
  subject: string | null;
  teacher: { fullName: string };
  joinable: boolean;
  expiresAt: string;
}
