import type { Types } from 'mongoose';

export const USER_ROLES = ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const REGISTRATION_SOURCES = [
  'SELF_REGISTRATION',
  'TEACHER_INVITATION',
  'ADMIN_BOOTSTRAP',
] as const;
export type RegistrationSource = (typeof REGISTRATION_SOURCES)[number];

export interface UserRecord {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  fullNameNormalized: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  registrationSource: RegistrationSource;
  studentCode?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  invitedBy?: Types.ObjectId | null;
  activatedAt?: Date | null;
  lastLoginAt?: Date | null;
  lastActiveAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export function toUserSummary(
  user: Pick<UserRecord, '_id' | 'fullName' | 'email' | 'role' | 'status'>,
): UserSummary {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}
