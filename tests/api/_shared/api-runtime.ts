import { Buffer } from 'node:buffer';
import { request, type APIRequestContext } from '@playwright/test';
import type { CabinetArea, TestEnv } from '../../../src/utils/data/load-test-data';
import { getApiBaseUrl as getBackendApiBaseUrl } from '../../_shared/helpers/combined/app-urls';

export interface ApiSession {
  api: APIRequestContext;
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: string;
  baseApiUrl: string;
}

export function getApiBaseUrl(_area: CabinetArea, testEnv: TestEnv): string {
  const apiBaseUrl = getBackendApiBaseUrl(testEnv);
  return `${apiBaseUrl}api/`;
}

export async function createApiContext(
  baseApiUrl: string,
  accessToken?: string,
): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: baseApiUrl,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });
}

export function decodeJwtPayload(token: string): { user_id?: string; role?: string } {
  const parts = token.split('.');

  if (parts.length < 2 || !parts[1]) {
    throw new Error('Не вдалося декодувати JWT payload');
  }

  const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const payloadText = Buffer.from(padded, 'base64').toString('utf-8');
  return JSON.parse(payloadText) as { user_id?: string; role?: string };
}

export async function disposeApiSession(session: ApiSession): Promise<void> {
  await session.api.dispose();
}
