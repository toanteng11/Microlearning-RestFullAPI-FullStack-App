import {
  type ClientSession,
  type HydratedDocument,
  isValidObjectId,
  type SortOrder,
  Types,
} from 'mongoose';

import { UserModel } from './user.model.js';
import type { RegistrationSource, UserRecord, UserRole, UserStatus } from './user.types.js';

export interface CreateUserInput {
  email: string;
  fullName: string;
  fullNameNormalized: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  registrationSource: RegistrationSource;
  invitedBy?: Types.ObjectId;
  activatedAt?: Date;
  department?: string | null;
  studentCode?: string | null;
}

export interface UserListQuery {
  roles: UserRole[];
  status?: UserStatus;
  keyword?: string;
  page: number;
  limit: number;
  sortBy: 'fullName' | 'email' | 'role' | 'status' | 'department' | 'lastActiveAt' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export class UserRepository {
  async create(
    input: CreateUserInput,
    session?: ClientSession,
  ): Promise<HydratedDocument<UserRecord>> {
    const user = new UserModel(input);
    return user.save({ session });
  }

  async findByEmail(
    email: string,
    session?: ClientSession,
  ): Promise<HydratedDocument<UserRecord> | null> {
    return UserModel.findOne({ email })
      .session(session ?? null)
      .exec();
  }

  async findCredentialByEmail(email: string): Promise<HydratedDocument<UserRecord> | null> {
    return UserModel.findOne({ email }).select('+passwordHash').exec();
  }

  async findById(
    userId: string,
    session?: ClientSession,
  ): Promise<HydratedDocument<UserRecord> | null> {
    if (!isValidObjectId(userId)) return null;
    return UserModel.findById(userId)
      .session(session ?? null)
      .exec();
  }

  async findActiveTeacherByEmail(email: string): Promise<HydratedDocument<UserRecord> | null> {
    return UserModel.findOne({ email, role: 'TEACHER', status: 'ACTIVE' }).exec();
  }

  async updateLastLogin(userId: Types.ObjectId, now: Date): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: { lastLoginAt: now } }).exec();
  }

  async updateProfile(userId: string, fullName: string, fullNameNormalized: string) {
    return UserModel.findOneAndUpdate(
      { _id: userId, status: 'ACTIVE' },
      { $set: { fullName, fullNameNormalized } },
      { returnDocument: 'after', runValidators: true },
    ).exec();
  }

  async listByRoles(query: UserListQuery): Promise<{
    items: HydratedDocument<UserRecord>[];
    totalItems: number;
  }> {
    const filter: Record<string, unknown> = { role: { $in: query.roles } };
    if (query.status) filter.status = query.status;
    if (query.keyword) {
      const prefix = new RegExp(`^${escapeRegex(query.keyword)}`, 'u');
      filter.$or = [{ fullNameNormalized: prefix }, { email: prefix }];
    }

    const direction: SortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, SortOrder> = { [query.sortBy]: direction, _id: direction };
    const [items, totalItems] = await Promise.all([
      UserModel.find(filter)
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      UserModel.countDocuments(filter).exec(),
    ]);

    return { items, totalItems };
  }

  async updateStatus(
    userId: string,
    expectedUpdatedAt: Date,
    status: UserStatus,
    now: Date,
    session: ClientSession,
  ) {
    return UserModel.findOneAndUpdate(
      { _id: userId, updatedAt: expectedUpdatedAt, status: { $ne: 'DELETED' } },
      { $set: { status, ...(status === 'DELETED' ? { deletedAt: now } : {}) } },
      { returnDocument: 'after', session, runValidators: true },
    ).exec();
  }

  async updateRole(
    userId: string,
    expectedUpdatedAt: Date,
    role: UserRole,
    session: ClientSession,
  ) {
    return UserModel.findOneAndUpdate(
      { _id: userId, updatedAt: expectedUpdatedAt, status: { $ne: 'DELETED' } },
      { $set: { role } },
      { returnDocument: 'after', session, runValidators: true },
    ).exec();
  }

  async countActiveSuperAdmins(session: ClientSession): Promise<number> {
    return UserModel.countDocuments({ role: 'SUPER_ADMIN', status: 'ACTIVE' })
      .session(session)
      .exec();
  }
}
