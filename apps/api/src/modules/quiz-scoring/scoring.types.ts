import type { QuestionType } from '../learning-content/assessment.types.js';

export interface ScoringQuestion {
  questionId: string;
  type: QuestionType;
  points: number;
  correctOptionIds: readonly string[];
  correctBoolean: boolean | null;
}

export interface ScoringAnswer {
  questionId: string;
  selectedOptionIds: readonly string[];
  textAnswer: string | null;
}

export interface ScoredAnswer {
  questionId: string;
  awardedPoints: number;
  requiresManualReview: boolean;
  answered: boolean;
}

export interface ObjectiveScoringResult {
  objectiveScore: number;
  requiresManualReview: boolean;
  answers: ScoredAnswer[];
}
