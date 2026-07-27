import { randomUUID } from 'node:crypto';

import { AppError, type ErrorDetail } from '../../shared/errors/app-error.js';
import type { AssessmentFeatureFlagConfig } from '../../shared/config/environment.js';
import type { QuestionProjection } from './question.repository.js';
import type {
  CreateQuestionInput,
  SetQuestionMediaInput,
  UpdateQuestionInput,
} from './question.schemas.js';
import type { QuestionMedia, QuestionOption, QuestionPatch } from './question.types.js';

export type OptionIdFactory = () => string;

function normalizedLabel(label: string): string {
  return label.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

function assertUniqueOptions(options: readonly QuestionOption[]): void {
  const labels = options.map((option) => normalizedLabel(option.label).toLocaleLowerCase('en-US'));
  const ids = options.map((option) => option.id);
  const details: ErrorDetail[] = [];
  if (new Set(labels).size !== labels.length)
    details.push({
      field: 'options',
      code: 'DUPLICATE_OPTION_LABEL',
      message: 'Option labels must be unique',
    });
  if (new Set(ids).size !== ids.length)
    details.push({
      field: 'options',
      code: 'DUPLICATE_OPTION_ID',
      message: 'Option IDs must be unique',
    });
  if (details.length > 0)
    throw new AppError(422, 'INVALID_QUESTION', 'Question options are invalid', details);
}

function assertCorrectIds(
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE',
  options: readonly QuestionOption[],
  ids: readonly string[],
): void {
  const optionIds = new Set(options.map((option) => option.id));
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !optionIds.has(id)) ||
    ids.length === 0 ||
    (type === 'SINGLE_CHOICE' && ids.length !== 1)
  ) {
    throw new AppError(422, 'INVALID_QUESTION', 'Correct option set is invalid', [
      {
        field: 'correctOptionIds',
        code: 'INVALID_CORRECT_SET',
        message: 'Correct options must be a unique subset of current option IDs',
      },
    ]);
  }
}

export function buildNewQuestionShape(
  input: CreateQuestionInput,
  createOptionId: OptionIdFactory = () => `opt_${randomUUID()}`,
): Pick<
  QuestionProjection,
  | 'type'
  | 'prompt'
  | 'points'
  | 'isRequired'
  | 'options'
  | 'correctOptionIds'
  | 'correctBoolean'
  | 'rubric'
  | 'explanation'
  | 'media'
> {
  if (input.type === 'SINGLE_CHOICE' || input.type === 'MULTIPLE_CHOICE') {
    const options = input.options.map((option, displayOrder) => ({
      id: createOptionId(),
      label: normalizedLabel(option.label),
      displayOrder,
    }));
    assertUniqueOptions(options);
    if (
      input.correctOptionIndexes.some((index) => index >= options.length) ||
      new Set(input.correctOptionIndexes).size !== input.correctOptionIndexes.length
    ) {
      throw new AppError(422, 'INVALID_QUESTION', 'Correct option indexes are invalid', [
        {
          field: 'correctOptionIndexes',
          code: 'INVALID_CORRECT_SET',
          message: 'Correct indexes must be unique and reference current options',
        },
      ]);
    }
    const correctOptionIds = input.correctOptionIndexes.map((index) => options[index]!.id);
    assertCorrectIds(input.type, options, correctOptionIds);
    return {
      type: input.type,
      prompt: input.prompt,
      points: input.points,
      isRequired: input.isRequired,
      options,
      correctOptionIds,
      correctBoolean: null,
      rubric: null,
      explanation: input.explanation,
      media: null,
    };
  }
  if (input.type === 'TRUE_FALSE') {
    return {
      type: input.type,
      prompt: input.prompt,
      points: input.points,
      isRequired: input.isRequired,
      options: [],
      correctOptionIds: [],
      correctBoolean: input.correctBoolean,
      rubric: null,
      explanation: input.explanation,
      media: null,
    };
  }
  return {
    type: input.type,
    prompt: input.prompt,
    points: input.points,
    isRequired: input.isRequired,
    options: [],
    correctOptionIds: [],
    correctBoolean: null,
    rubric: input.rubric,
    explanation: input.explanation,
    media: null,
  };
}

export function buildQuestionPatch(
  current: QuestionProjection,
  input: UpdateQuestionInput,
): QuestionPatch {
  const patch: QuestionPatch = {};
  if (input.prompt !== undefined) patch.prompt = input.prompt;
  if (input.points !== undefined) patch.points = input.points;
  if (input.isRequired !== undefined) patch.isRequired = input.isRequired;
  if (input.explanation !== undefined) patch.explanation = input.explanation;

  if (current.type === 'SINGLE_CHOICE' || current.type === 'MULTIPLE_CHOICE') {
    if (input.correctBoolean !== undefined || input.rubric !== undefined)
      throw new AppError(422, 'INVALID_QUESTION', 'Fields do not match Question type');
    const options =
      input.options?.map((option, displayOrder) => ({
        ...option,
        label: normalizedLabel(option.label),
        displayOrder,
      })) ?? current.options;
    const correctOptionIds = input.correctOptionIds ?? current.correctOptionIds;
    assertUniqueOptions(options);
    assertCorrectIds(current.type, options, correctOptionIds);
    if (input.options !== undefined) patch.options = options;
    if (input.correctOptionIds !== undefined || input.options !== undefined)
      patch.correctOptionIds = [...correctOptionIds];
  } else if (current.type === 'TRUE_FALSE') {
    if (
      input.options !== undefined ||
      input.correctOptionIds !== undefined ||
      input.rubric !== undefined
    )
      throw new AppError(422, 'INVALID_QUESTION', 'Fields do not match Question type');
    if (input.correctBoolean !== undefined) patch.correctBoolean = input.correctBoolean;
  } else {
    if (
      input.options !== undefined ||
      input.correctOptionIds !== undefined ||
      input.correctBoolean !== undefined
    )
      throw new AppError(422, 'INVALID_QUESTION', 'Fields do not match Question type');
    if (input.rubric !== undefined) patch.rubric = input.rubric;
  }
  return patch;
}

export function buildQuestionMedia(
  input: SetQuestionMediaInput,
  flags: AssessmentFeatureFlagConfig,
): QuestionMedia {
  const enabled =
    input.kind === 'IMAGE_URL' ? flags.questionImageUrlEnabled : flags.questionVideoUrlEnabled;
  if (!enabled) throw new AppError(409, 'FEATURE_NOT_ENABLED', 'Question URL media is disabled');
  const url = new URL(input.url);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !flags.questionMediaAllowedHosts.includes(url.hostname.toLowerCase())
  ) {
    throw new AppError(422, 'INVALID_QUESTION_MEDIA', 'Question media URL is not allowed', [
      {
        field: 'url',
        code: 'HOST_NOT_ALLOWED',
        message: 'Use HTTPS with an approved media hostname',
      },
    ]);
  }
  return {
    kind: input.kind,
    url: url.toString(),
    provider: url.hostname.toLowerCase(),
    caption: input.caption,
    altText: input.altText,
  };
}
