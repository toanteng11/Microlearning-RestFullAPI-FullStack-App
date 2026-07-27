import type {
  AssignmentStatus,
  AttemptStatus,
  QuestionType,
  QuizStatus,
  SubmissionStatus,
} from './assessment.types';

export const quizStatusLabels: Record<QuizStatus, string> = {
  DRAFT: 'Bản nháp',
  SCHEDULED: 'Đã lên lịch',
  PUBLISHED: 'Đã xuất bản',
  UNPUBLISHED: 'Đã thu hồi',
  ARCHIVED: 'Đã lưu trữ',
};

export const questionTypeLabels: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Một đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
};

export const attemptStatusLabels: Record<AttemptStatus, string> = {
  IN_PROGRESS: 'Đang làm',
  SUBMITTED: 'Đã nộp',
  TIMED_OUT: 'Hết thời gian',
  NEEDS_REVIEW: 'Chờ chấm',
  GRADED: 'Đã chấm',
  RESULT_RELEASED: 'Đã có kết quả',
};

export const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  DRAFT: 'Bản nháp',
  SCHEDULED: 'Đã lên lịch',
  PUBLISHED: 'Đã xuất bản',
  UNPUBLISHED: 'Đã thu hồi',
  CLOSED: 'Đã đóng',
  ARCHIVED: 'Đã lưu trữ',
};

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  LATE: 'Nộp muộn',
  GRADED: 'Đã chấm',
  RETURNED: 'Đã trả bài',
};

export function displayAssessmentDate(value: string | null): string {
  if (!value) return 'Chưa đặt';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function toLocalDateTime(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
