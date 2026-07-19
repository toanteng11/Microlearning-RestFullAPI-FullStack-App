import type { SortOrder } from 'mongoose';
import { z } from 'zod';

export const LIST_PAGE_DEFAULT = 1;
export const LIST_LIMIT_DEFAULT = 20;
export const LIST_LIMIT_MAX = 100;

export function createListQuerySchema<const T extends readonly [string, ...string[]]>(
  sortFields: T,
  defaultSort: T[number],
) {
  return z
    .object({
      page: z.coerce.number().int().min(1).default(LIST_PAGE_DEFAULT),
      limit: z.coerce.number().int().min(1).max(LIST_LIMIT_MAX).default(LIST_LIMIT_DEFAULT),
      keyword: z.string().trim().min(1).max(100).optional(),
      sortBy: z.enum(sortFields).default(defaultSort),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    .strict();
}

export function normalizeSearchKeyword(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0111\u0110]/gu, 'd')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/gu, ' ');
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function createStableSort(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): Record<string, SortOrder> {
  const direction: SortOrder = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: direction, _id: direction };
}

export interface Page<T> {
  items: T[];
  totalItems: number;
  page: number;
  limit: number;
}
