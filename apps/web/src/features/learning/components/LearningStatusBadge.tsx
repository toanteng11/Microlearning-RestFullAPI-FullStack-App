import type { ContentStatus, DerivedLearningStatus } from '../learning.types';
import { contentStatusLabel, progressStatusLabel } from '../learning-format';

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`learning-badge learning-badge--${status.toLowerCase()}`}>
      {contentStatusLabel(status)}
    </span>
  );
}

export function ProgressStatusBadge({ status }: { status: DerivedLearningStatus }) {
  return (
    <span className={`learning-badge learning-badge--${status.toLowerCase()}`}>
      {progressStatusLabel(status)}
    </span>
  );
}
