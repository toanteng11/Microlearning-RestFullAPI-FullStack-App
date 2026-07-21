import type { IndexDefinition, IndexOptions, Model } from 'mongoose';

import type { AppConfig } from '../config/environment.js';

function canonical(value: unknown): string {
  if (!value || typeof value !== 'object' || value instanceof Date) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
}

function assertIndexCompatibility(
  phaseLabel: string,
  collectionName: string,
  expectedKey: IndexDefinition,
  expectedOptions: IndexOptions,
  actual: Record<string, unknown> | undefined,
): void {
  const name = expectedOptions.name;
  if (!name || !actual) {
    throw new Error(`${phaseLabel} index compatibility check failed for ${collectionName}.${name}`);
  }

  const sameKey = canonical(actual.key) === canonical(expectedKey);
  const sameUnique = Boolean(actual.unique) === Boolean(expectedOptions.unique);
  const samePartial =
    canonical(actual.partialFilterExpression ?? null) ===
    canonical(expectedOptions.partialFilterExpression ?? null);
  const sameTtl =
    canonical(actual.expireAfterSeconds ?? null) ===
    canonical(expectedOptions.expireAfterSeconds ?? null);

  if (!sameKey || !sameUnique || !samePartial || !sameTtl) {
    throw new Error(`${phaseLabel} index compatibility check failed for ${collectionName}.${name}`);
  }
}

export async function initializeModelIndexes(
  phaseLabel: string,
  models: readonly Model<unknown>[],
  appEnvironment: AppConfig['appEnvironment'],
): Promise<void> {
  const mayCreateIndexes = appEnvironment === 'development' || appEnvironment === 'test';

  for (const model of models) {
    if (mayCreateIndexes) await model.createIndexes();

    let indexes: Record<string, unknown>[];
    try {
      indexes = (await model.collection.indexes()) as Record<string, unknown>[];
    } catch {
      throw new Error(
        `${phaseLabel} index compatibility check failed for ${model.collection.collectionName}`,
      );
    }

    const actualByName = new Map(indexes.map((index) => [String(index.name), index]));
    for (const [expectedKey, expectedOptions] of model.schema.indexes()) {
      assertIndexCompatibility(
        phaseLabel,
        model.collection.collectionName,
        expectedKey,
        expectedOptions,
        actualByName.get(String(expectedOptions.name)),
      );
    }
  }
}
