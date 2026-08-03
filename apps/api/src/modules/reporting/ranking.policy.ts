export interface RankingCandidate {
  studentId: string;
  processScore: number | null;
  completedRequiredCount: number;
  missingActivityCount: number;
  lateActivityCount: number;
  lastActiveAt: Date | null;
}

function compareNullableDesc(left: number | Date | null, right: number | Date | null): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  const leftValue = left instanceof Date ? left.getTime() : left;
  const rightValue = right instanceof Date ? right.getTime() : right;
  return rightValue - leftValue;
}

export function compareDefaultRanking(left: RankingCandidate, right: RankingCandidate): number {
  return (
    compareNullableDesc(left.processScore, right.processScore) ||
    right.completedRequiredCount - left.completedRequiredCount ||
    left.missingActivityCount - right.missingActivityCount ||
    left.lateActivityCount - right.lateActivityCount ||
    compareNullableDesc(left.lastActiveAt, right.lastActiveAt) ||
    left.studentId.localeCompare(right.studentId)
  );
}

export function rankCandidates<T extends RankingCandidate>(
  candidates: readonly T[],
): Array<T & { rank: number }> {
  return [...candidates]
    .sort(compareDefaultRanking)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}
