import type { Page, Response } from '@playwright/test';
import type { CapturedJsonApiResponse, OrderApiState } from './order-lifecycle.types';

const ORDER_ID_KEYS = ['id', 'uuid', 'orderId', 'order_id'];
const ORDER_NUMBER_KEYS = [
  'number',
  'orderNumber',
  'order_number',
  'publicNumber',
  'public_number',
  'displayNumber',
];
const ORDER_STATUS_KEYS = ['status', 'orderStatus', 'order_status', 'moderationStatus', 'state'];
const ORDER_TITLE_KEYS = ['title', 'name', 'positionName', 'position_name'];
const ORDER_CREATED_AT_KEYS = ['createdAt', 'created_at', 'created', 'published_at'];

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized === '' ? undefined : normalized;
}

function isLikelyOrderStatus(value: string): boolean {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > 50) {
    return false;
  }
  if (normalized.includes('/') || normalized.includes('http')) {
    return false;
  }
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(normalized)) {
    return false;
  }
  return /^[a-z][a-z0-9_-]*$/i.test(normalized);
}

function extractStatusCandidate(value: unknown): string | undefined {
  const direct = normalizeText(value);
  if (direct && isLikelyOrderStatus(direct)) {
    return direct;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key of ['slug', 'code', 'value', 'name', 'key']) {
    const nested = normalizeText(record[key]);
    if (nested && isLikelyOrderStatus(nested)) {
      return nested;
    }
  }

  return undefined;
}

function findFirstStringByKeys(
  value: unknown,
  keys: string[],
  visited = new Set<unknown>(),
): string | undefined {
  if (!value || typeof value !== 'object') {
    return normalizeText(value);
  }

  if (visited.has(value)) {
    return undefined;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findFirstStringByKeys(item, keys, visited);
      if (result) {
        return result;
      }
    }
    return undefined;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (keys.includes(key)) {
      const direct = normalizeText(nestedValue);
      if (direct) {
        return direct;
      }
    }
  }

  for (const nestedValue of Object.values(value)) {
    const result = findFirstStringByKeys(nestedValue, keys, visited);
    if (result) {
      return result;
    }
  }

  return undefined;
}

export function extractOrderStatus(object: Record<string, unknown>): string | undefined {
  for (const key of ORDER_STATUS_KEYS) {
    if (!(key in object)) {
      continue;
    }

    const result = extractStatusCandidate(object[key]);
    if (result) {
      return result;
    }
  }

  return undefined;
}

export function extractOrderStatusFromPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const result = extractOrderStatusFromPayload(item);
      if (result) {
        return result;
      }
    }
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const direct = extractOrderStatus(record);
  if (direct) {
    return direct;
  }

  for (const key of ['data', 'result', 'item', 'order']) {
    if (!(key in record)) {
      continue;
    }
    const nested = extractOrderStatusFromPayload(record[key]);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function collectMatchingObjects(
  value: unknown,
  needles: string[],
  pathSegments: Array<string | number> = [],
  matches: Array<{
    path: Array<string | number>;
    object: Record<string, unknown>;
    matchedNeedle: string;
  }> = [],
  visited = new Set<unknown>(),
): Array<{ path: Array<string | number>; object: Record<string, unknown>; matchedNeedle: string }> {
  if (!value || typeof value !== 'object') {
    return matches;
  }

  if (visited.has(value)) {
    return matches;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectMatchingObjects(item, needles, [...pathSegments, index], matches, visited),
    );
    return matches;
  }

  const record = value as Record<string, unknown>;
  const serialized = JSON.stringify(record);
  const matchedNeedle = needles.find((needle) => serialized.includes(needle));
  if (matchedNeedle) {
    matches.push({
      path: pathSegments,
      object: record,
      matchedNeedle,
    });
  }

  for (const [key, nestedValue] of Object.entries(record)) {
    collectMatchingObjects(nestedValue, needles, [...pathSegments, key], matches, visited);
  }

  return matches;
}

function extractArrayIndex(pathSegments: Array<string | number>): number | undefined {
  return pathSegments.find((segment) => typeof segment === 'number') as number | undefined;
}

function scoreOrderCandidate(
  object: Record<string, unknown>,
  matchedNeedle: string,
  pathSegments: Array<string | number>,
): number {
  let score = 0;
  const serialized = JSON.stringify(object);

  if (serialized.includes(matchedNeedle)) {
    score += 4;
  }
  if (extractOrderStatus(object)) {
    score += 4;
  }
  if (findFirstStringByKeys(object, ORDER_ID_KEYS)) {
    score += 3;
  }
  if (findFirstStringByKeys(object, ORDER_NUMBER_KEYS)) {
    score += 3;
  }
  if (findFirstStringByKeys(object, ORDER_TITLE_KEYS)) {
    score += 1;
  }
  if (extractArrayIndex(pathSegments) !== undefined) {
    score += 2;
  }

  return score;
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers()['content-type'] ?? '';
  return contentType.includes('application/json');
}

export async function captureJsonApiResponsesWhile<T>(
  page: Page,
  action: () => Promise<T>,
): Promise<{ result: T; responses: CapturedJsonApiResponse[] }> {
  const responses: CapturedJsonApiResponse[] = [];
  const pendingExtractions: Promise<void>[] = [];

  const handler = (response: Response) => {
    if (!response.url().includes('/api/') || !isJsonResponse(response)) {
      return;
    }

    pendingExtractions.push(
      (async () => {
        try {
          const bodyText = await response.text();
          let bodyJson: unknown = bodyText;
          try {
            bodyJson = JSON.parse(bodyText);
          } catch {
            bodyJson = bodyText;
          }

          responses.push({
            url: response.url(),
            method: response.request().method(),
            status: response.status(),
            bodyText,
            bodyJson,
          });
        } catch {
          void 0;
        }
      })(),
    );
  };

  page.on('response', handler);
  try {
    const result = await action();
    await Promise.allSettled(pendingExtractions);
    return { result, responses };
  } finally {
    page.off('response', handler);
  }
}

export function findOrderStateInCapturedResponses(
  responses: CapturedJsonApiResponse[],
  identifiers: string[],
): OrderApiState | null {
  const normalizedIdentifiers = identifiers.map((value) => value.trim()).filter(Boolean);
  if (normalizedIdentifiers.length === 0) {
    return null;
  }

  const candidates = responses.flatMap((response) => {
    if (
      !response.bodyText ||
      !normalizedIdentifiers.some((needle) => response.bodyText.includes(needle))
    ) {
      return [];
    }

    return collectMatchingObjects(response.bodyJson, normalizedIdentifiers).map((match) => ({
      sourceUrl: response.url,
      responseStatus: response.status,
      matchedNeedle: match.matchedNeedle,
      arrayIndex: extractArrayIndex(match.path),
      rawMatch: match.object,
      score: scoreOrderCandidate(match.object, match.matchedNeedle, match.path),
      id: findFirstStringByKeys(match.object, ORDER_ID_KEYS),
      publicNumber: findFirstStringByKeys(match.object, ORDER_NUMBER_KEYS),
      status: extractOrderStatus(match.object),
      title: findFirstStringByKeys(match.object, ORDER_TITLE_KEYS),
      createdAt: findFirstStringByKeys(match.object, ORDER_CREATED_AT_KEYS),
    }));
  });

  if (candidates.length === 0) {
    return null;
  }

  const bestCandidate = candidates.sort((left, right) => right.score - left.score)[0];
  return {
    id: bestCandidate.id,
    publicNumber: bestCandidate.publicNumber,
    status: bestCandidate.status,
    title: bestCandidate.title,
    createdAt: bestCandidate.createdAt,
    arrayIndex: bestCandidate.arrayIndex,
    sourceUrl: bestCandidate.sourceUrl,
    responseStatus: bestCandidate.responseStatus,
    matchedNeedle: bestCandidate.matchedNeedle,
    rawMatch: bestCandidate.rawMatch,
  };
}
