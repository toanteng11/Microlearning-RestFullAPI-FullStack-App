import type { ClientSession, Types } from 'mongoose';

import { FlashcardModel, type FlashcardRecord } from './flashcard.model.js';
import type {
  FlashcardMetadataPatch,
  FlashcardOrderAssignment,
  NewFlashcard,
} from './flashcard.types.js';

const FLASHCARD_PROJECTION = {
  lessonId: 1,
  frontText: 1,
  backText: 1,
  displayOrder: 1,
  status: 1,
  archivedAt: 1,
  schemaVersion: 1,
  createdBy: 1,
  updatedBy: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export type FlashcardProjection = FlashcardRecord;

export class FlashcardRepository {
  async create(input: NewFlashcard, session?: ClientSession): Promise<FlashcardProjection> {
    const flashcard = await new FlashcardModel(input).save({ session });
    return flashcard.toObject();
  }

  findById(flashcardId: Types.ObjectId, session?: ClientSession) {
    return FlashcardModel.findById(flashcardId)
      .select(FLASHCARD_PROJECTION)
      .session(session ?? null)
      .lean<FlashcardProjection>()
      .exec();
  }

  listActiveByLesson(lessonId: Types.ObjectId, session?: ClientSession) {
    return FlashcardModel.find({ lessonId, status: 'ACTIVE' })
      .select(FLASHCARD_PROJECTION)
      .sort({ displayOrder: 1, _id: 1 })
      .session(session ?? null)
      .lean<FlashcardProjection[]>()
      .exec();
  }

  async nextDisplayOrder(lessonId: Types.ObjectId, session?: ClientSession): Promise<number> {
    const [last] = await FlashcardModel.find({ lessonId, status: 'ACTIVE' })
      .select({ displayOrder: 1 })
      .sort({ displayOrder: -1, _id: -1 })
      .limit(1)
      .session(session ?? null)
      .lean<Array<Pick<FlashcardRecord, 'displayOrder'>>>()
      .exec();
    return (last?.displayOrder ?? -1) + 1;
  }

  updateMetadataCas(
    input: {
      flashcardId: Types.ObjectId;
      expectedUpdatedAt: Date;
      updatedBy: Types.ObjectId;
      patch: FlashcardMetadataPatch;
    },
    session: ClientSession,
  ) {
    return FlashcardModel.findOneAndUpdate(
      { _id: input.flashcardId, status: 'ACTIVE', updatedAt: input.expectedUpdatedAt },
      { $set: { ...input.patch, updatedBy: input.updatedBy } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(FLASHCARD_PROJECTION)
      .lean<FlashcardProjection>()
      .exec();
  }

  archiveCas(
    input: {
      flashcardId: Types.ObjectId;
      expectedUpdatedAt: Date;
      actorId: Types.ObjectId;
      archivedAt: Date;
    },
    session: ClientSession,
  ) {
    return FlashcardModel.findOneAndUpdate(
      { _id: input.flashcardId, status: 'ACTIVE', updatedAt: input.expectedUpdatedAt },
      { $set: { status: 'ARCHIVED', archivedAt: input.archivedAt, updatedBy: input.actorId } },
      { returnDocument: 'after', runValidators: true, session },
    )
      .select(FLASHCARD_PROJECTION)
      .lean<FlashcardProjection>()
      .exec();
  }

  async reorder(
    lessonId: Types.ObjectId,
    assignments: readonly FlashcardOrderAssignment[],
    actorId: Types.ObjectId,
    session: ClientSession,
  ): Promise<void> {
    if (assignments.length === 0) return;
    const result = await FlashcardModel.bulkWrite(
      assignments.map((assignment) => ({
        updateOne: {
          filter: { _id: assignment.flashcardId, lessonId, status: 'ACTIVE' },
          update: { $set: { displayOrder: assignment.displayOrder, updatedBy: actorId } },
        },
      })),
      { session, ordered: true },
    );
    if (result.matchedCount !== assignments.length) {
      throw new Error('Flashcard reorder set changed during transaction');
    }
  }

  countActiveByLesson(lessonId: Types.ObjectId, session?: ClientSession): Promise<number> {
    return FlashcardModel.countDocuments({ lessonId, status: 'ACTIVE' })
      .session(session ?? null)
      .exec();
  }
}
