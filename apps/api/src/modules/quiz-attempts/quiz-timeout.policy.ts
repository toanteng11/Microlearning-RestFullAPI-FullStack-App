export function resolveAttemptExpiry(
  startedAt: Date,
  dueDate: Date,
  timeLimitMinutes: number | null,
): Date {
  if (timeLimitMinutes === null) return new Date(dueDate);
  const timeLimitExpiry = new Date(startedAt.getTime() + timeLimitMinutes * 60_000);
  return timeLimitExpiry < dueDate ? timeLimitExpiry : new Date(dueDate);
}

export function isAttemptExpired(expiresAt: Date, now: Date): boolean {
  return now >= expiresAt;
}
