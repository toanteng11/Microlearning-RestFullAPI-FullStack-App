export type TeacherInvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export type TeacherInvitationChannel =
  'EMAIL' | 'ZALO' | 'FACEBOOK' | 'MESSENGER' | 'TEAMS' | 'OTHER';

export interface TeacherInvitationSummary {
  id: string;
  email: string;
  status: TeacherInvitationStatus;
  deliveryMethod: 'MANUAL_COPY';
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  copyCount: number;
  lastCopiedAt: string | null;
  channelHint: TeacherInvitationChannel | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherInvitationListEnvelope {
  success: true;
  data: TeacherInvitationSummary[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    email: string | null;
    status: TeacherInvitationStatus | null;
  };
}

export interface CreatedTeacherInvitation extends TeacherInvitationSummary {
  invitationLink: string;
}

export interface TeacherInvitationPreview {
  email: string;
  expiresAt: string;
  status: 'PENDING';
  deliveryMethod: 'MANUAL_COPY';
}

export interface TeacherActivationEnvelope {
  success: true;
  data: {
    user: {
      id: string;
      fullName: string;
      email: string;
      role: 'TEACHER';
      status: 'ACTIVE';
    };
    nextAction: 'LOGIN';
  };
}
