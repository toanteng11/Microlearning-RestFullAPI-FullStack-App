import type { ClassroomStatus } from '../classrooms/classroom.types.js';
import type { CommonContentStatus } from '../learning-content/content.types.js';
import type { InvitationStatus } from '../teacher-invitations/teacher-invitation.model.js';
import type { UserRole, UserStatus } from '../users/user.types.js';
import type { ReportingGovernanceCounts } from './reporting.types.js';

export interface ReportingGovernanceQuery {
  asOf: Date;
  from?: Date;
  to?: Date;
  role?: UserRole;
  userStatus?: UserStatus;
  invitationStatus?: InvitationStatus;
  classroomStatus?: ClassroomStatus;
  courseStatus?: CommonContentStatus;
}

export interface ReportingGovernanceReader {
  readCounts(query: ReportingGovernanceQuery): Promise<ReportingGovernanceCounts>;
  getSourceWatermark(): Promise<Date | null>;
}
