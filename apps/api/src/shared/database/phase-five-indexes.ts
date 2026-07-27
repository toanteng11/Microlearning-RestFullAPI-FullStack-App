import type { Model } from 'mongoose';

import { AssignmentModel } from '../../modules/assignments/assignment.model.js';
import { DeadlineExceptionHistoryModel } from '../../modules/deadline-exceptions/deadline-exception-history.model.js';
import { DeadlineExceptionModel } from '../../modules/deadline-exceptions/deadline-exception.model.js';
import { GradeRevisionModel } from '../../modules/grades/grade-revision.model.js';
import { GradeModel } from '../../modules/grades/grade.model.js';
import { QuestionModel } from '../../modules/questions/question.model.js';
import { QuizAttemptModel } from '../../modules/quiz-attempts/quiz-attempt.model.js';
import { QuizModel } from '../../modules/quizzes/quiz.model.js';
import { SubmissionRevisionModel } from '../../modules/submissions/submission-revision.model.js';
import { SubmissionModel } from '../../modules/submissions/submission.model.js';
import type { AppConfig } from '../config/environment.js';
import { initializeModelIndexes } from './index-compatibility.js';

export const PHASE_FIVE_MODELS: readonly Model<unknown>[] = [
  QuizModel as unknown as Model<unknown>,
  QuestionModel as unknown as Model<unknown>,
  QuizAttemptModel as unknown as Model<unknown>,
  AssignmentModel as unknown as Model<unknown>,
  SubmissionModel as unknown as Model<unknown>,
  SubmissionRevisionModel as unknown as Model<unknown>,
  GradeModel as unknown as Model<unknown>,
  GradeRevisionModel as unknown as Model<unknown>,
  DeadlineExceptionModel as unknown as Model<unknown>,
  DeadlineExceptionHistoryModel as unknown as Model<unknown>,
];

export function initializePhaseFiveIndexes(
  appEnvironment: AppConfig['appEnvironment'],
): Promise<void> {
  return initializeModelIndexes('Phase 05', PHASE_FIVE_MODELS, appEnvironment);
}
