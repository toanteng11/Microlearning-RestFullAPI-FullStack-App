import { AppError } from '../../shared/errors/app-error.js';

export interface OrderableContentItem {
  id: string;
  displayOrder: number;
}

export interface CanonicalOrderAssignment {
  id: string;
  displayOrder: number;
}

function orderSetMismatch(reason: string): AppError {
  return new AppError(422, 'ORDER_SET_MISMATCH', 'Ordered IDs must match all active children', [
    { code: reason, message: 'Ordered IDs must contain each active child exactly once' },
  ]);
}

export function assignExactOrder(
  activeChildIds: readonly string[],
  orderedIds: readonly string[],
): CanonicalOrderAssignment[] {
  const activeSet = new Set(activeChildIds);
  const orderedSet = new Set(orderedIds);

  if (activeSet.size !== activeChildIds.length) throw orderSetMismatch('INVALID_ACTIVE_SET');
  if (orderedSet.size !== orderedIds.length) throw orderSetMismatch('DUPLICATE_ID');
  if (activeChildIds.length !== orderedIds.length) throw orderSetMismatch('INCOMPLETE_SET');
  if (orderedIds.some((id) => !activeSet.has(id))) throw orderSetMismatch('FOREIGN_OR_ARCHIVED_ID');

  return orderedIds.map((id, displayOrder) => ({ id, displayOrder }));
}

export function sortCanonical<T extends OrderableContentItem>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => {
    const orderDifference = left.displayOrder - right.displayOrder;
    if (orderDifference !== 0) return orderDifference;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
}
