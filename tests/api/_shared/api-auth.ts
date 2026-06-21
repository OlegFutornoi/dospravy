import { expect } from '@playwright/test';
import type { AuthDataFile, TestEnv } from '../../../src/utils/data/load-test-data';
import { createApiContext, decodeJwtPayload, getApiBaseUrl, type ApiSession } from './api-runtime';

type TokensResponse = {
  access: string;
  refresh: string;
};

type BusinessOtpRequestResponse = {
  company_id: string;
  magic_link_id: string;
};

function normalizeBusinessPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('380') ? `+${digits}` : `+38${digits}`;
}

function buildSession(
  baseApiUrl: string,
  tokens: TokensResponse,
  decoded: { user_id?: string; role?: string },
  api: Awaited<ReturnType<typeof createApiContext>>,
): ApiSession {
  if (!decoded.user_id) {
    throw new Error('У JWT токені відсутній user_id');
  }

  if (!decoded.role) {
    throw new Error('У JWT токені відсутня роль користувача');
  }

  return {
    api,
    accessToken: tokens.access,
    refreshToken: tokens.refresh,
    userId: decoded.user_id,
    role: decoded.role,
    baseApiUrl,
  };
}

export async function loginCrmViaApi(
  authData: AuthDataFile,
  testEnv: TestEnv,
): Promise<ApiSession> {
  const baseApiUrl = getApiBaseUrl('crm', testEnv);
  const anonymousApi = await createApiContext(baseApiUrl);

  const loginResponse = await anonymousApi.post('v1/users/login/', {
    data: {
      email: authData.auth.emailPassword.email,
      password: authData.auth.emailPassword.password,
    },
  });

  expect(loginResponse.ok(), 'CRM API login має завершитися успішно').toBeTruthy();
  const tokens = (await loginResponse.json()) as TokensResponse;
  await anonymousApi.dispose();

  const authorizedApi = await createApiContext(baseApiUrl, tokens.access);
  return buildSession(baseApiUrl, tokens, decodeJwtPayload(tokens.access), authorizedApi);
}

export async function loginBusinessViaApi(
  authData: AuthDataFile,
  testEnv: TestEnv,
): Promise<ApiSession & { companyId: string; magicLinkId: string }> {
  const baseApiUrl = getApiBaseUrl('business', testEnv);
  const anonymousApi = await createApiContext(baseApiUrl);

  const otpRequestResponse = await anonymousApi.post('v1/users/contact-person/otp/request/', {
    data: {
      phone: normalizeBusinessPhone(authData.auth.phoneOtp.phone),
    },
  });

  expect(otpRequestResponse.ok(), 'Business OTP request має завершитися успішно').toBeTruthy();
  const otpRequestBody = (await otpRequestResponse.json()) as BusinessOtpRequestResponse;

  const otpVerifyResponse = await anonymousApi.post('v1/users/contact-person/otp/verify/', {
    data: {
      phone: normalizeBusinessPhone(authData.auth.phoneOtp.phone),
      otp: authData.auth.phoneOtp.otp,
      company_id: otpRequestBody.company_id,
    },
  });

  expect(otpVerifyResponse.ok(), 'Business OTP verify має завершитися успішно').toBeTruthy();
  const tokens = (await otpVerifyResponse.json()) as TokensResponse;
  await anonymousApi.dispose();

  const authorizedApi = await createApiContext(baseApiUrl, tokens.access);
  const session = buildSession(baseApiUrl, tokens, decodeJwtPayload(tokens.access), authorizedApi);

  return {
    ...session,
    companyId: otpRequestBody.company_id,
    magicLinkId: otpRequestBody.magic_link_id,
  };
}
