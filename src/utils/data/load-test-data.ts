import fs from 'node:fs';
import path from 'node:path';

export type TestEnv = 'dev' | 'stage' | 'prod';
export type AppArea = 'business' | 'crm';

const ALLOWED_ENVS: TestEnv[] = ['dev', 'stage', 'prod'];
const ALLOWED_AREAS: AppArea[] = ['business', 'crm'];

export interface RuntimeContext {
  testEnv: TestEnv;
  appArea: AppArea;
}

export interface AuthDataFile {
  environment: TestEnv;
  area: AppArea;
  auth: {
    emailPassword: {
      email: string;
      password: string;
      rememberMe: boolean;
    };
    phoneOtp: {
      phone: string;
      otp: string;
      resendTimeoutSec: number;
    };
  };
}

export interface TestDataFile {
  environment: TestEnv;
  area: AppArea;
  users: {
    primary: {
      email: string;
      phone: string;
      firstName?: string;
      lastName?: string;
    };
    secondary: {
      email: string;
      phone: string;
      firstName?: string;
      lastName?: string;
    };
  };
  defaults: {
    otpCodeLength: number;
    countryCode: string;
  };
}

interface LoadedData {
  authData: AuthDataFile;
  testData: TestDataFile;
}

function ensureRecord(value: unknown, pathName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Некоректна структура даних у "${pathName}"`);
  }

  return value as Record<string, unknown>;
}

function ensureString(value: unknown, pathName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Поле "${pathName}" має бути непорожнім рядком`);
  }

  return value.trim();
}

function ensureNumber(value: unknown, pathName: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Поле "${pathName}" має бути числом`);
  }

  return value;
}

function ensureNoPlaceholder(value: string, pathName: string): string {
  const normalized = value.trim();

  if (
    normalized === 'CHANGE_ME' ||
    normalized === '0000' ||
    normalized === '+380000000000' ||
    normalized.endsWith('@example.com')
  ) {
    throw new Error(`У data-файлі залишився шаблон замість реального значення: "${pathName}"`);
  }

  return normalized;
}

function validateAuthDataFile(data: unknown): AuthDataFile {
  const root = ensureRecord(data, 'auth.json');
  const auth = ensureRecord(root.auth, 'auth.json.auth');
  const emailPassword = ensureRecord(auth.emailPassword, 'auth.json.auth.emailPassword');
  const phoneOtp = ensureRecord(auth.phoneOtp, 'auth.json.auth.phoneOtp');

  return {
    environment: ensureString(root.environment, 'auth.json.environment') as TestEnv,
    area: ensureString(root.area, 'auth.json.area') as AppArea,
    auth: {
      emailPassword: {
        email: ensureNoPlaceholder(
          ensureString(emailPassword.email, 'auth.json.auth.emailPassword.email'),
          'auth.json.auth.emailPassword.email',
        ),
        password: ensureNoPlaceholder(
          ensureString(emailPassword.password, 'auth.json.auth.emailPassword.password'),
          'auth.json.auth.emailPassword.password',
        ),
        rememberMe: Boolean(emailPassword.rememberMe),
      },
      phoneOtp: {
        phone: ensureNoPlaceholder(
          ensureString(phoneOtp.phone, 'auth.json.auth.phoneOtp.phone'),
          'auth.json.auth.phoneOtp.phone',
        ),
        otp: ensureNoPlaceholder(
          ensureString(phoneOtp.otp, 'auth.json.auth.phoneOtp.otp'),
          'auth.json.auth.phoneOtp.otp',
        ),
        resendTimeoutSec: ensureNumber(
          phoneOtp.resendTimeoutSec,
          'auth.json.auth.phoneOtp.resendTimeoutSec',
        ),
      },
    },
  };
}

function validateUserData(value: unknown, pathName: string): TestDataFile['users']['primary'] {
  const user = ensureRecord(value, pathName);

  return {
    email: ensureString(user.email, `${pathName}.email`),
    phone: ensureString(user.phone, `${pathName}.phone`),
    firstName:
      typeof user.firstName === 'string' && user.firstName.trim() !== ''
        ? user.firstName.trim()
        : undefined,
    lastName:
      typeof user.lastName === 'string' && user.lastName.trim() !== ''
        ? user.lastName.trim()
        : undefined,
  };
}

function validateTestDataFile(data: unknown): TestDataFile {
  const root = ensureRecord(data, 'test-data.json');
  const users = ensureRecord(root.users, 'test-data.json.users');
  const defaults = ensureRecord(root.defaults, 'test-data.json.defaults');

  return {
    environment: ensureString(root.environment, 'test-data.json.environment') as TestEnv,
    area: ensureString(root.area, 'test-data.json.area') as AppArea,
    users: {
      primary: validateUserData(users.primary, 'test-data.json.users.primary'),
      secondary: validateUserData(users.secondary, 'test-data.json.users.secondary'),
    },
    defaults: {
      otpCodeLength: ensureNumber(defaults.otpCodeLength, 'test-data.json.defaults.otpCodeLength'),
      countryCode: ensureString(defaults.countryCode, 'test-data.json.defaults.countryCode'),
    },
  };
}

function isTestEnv(value: string): value is TestEnv {
  return ALLOWED_ENVS.includes(value as TestEnv);
}

function isAppArea(value: string): value is AppArea {
  return ALLOWED_AREAS.includes(value as AppArea);
}

export function getRuntimeContext(): RuntimeContext {
  const rawEnv = process.env.TEST_ENV ?? process.env.BUSINESS_ENV ?? 'stage';
  const rawArea = process.env.APP_AREA ?? 'business';

  if (!isTestEnv(rawEnv)) {
    throw new Error(`Invalid TEST_ENV: "${rawEnv}". Allowed: ${ALLOWED_ENVS.join(', ')}`);
  }

  if (!isAppArea(rawArea)) {
    throw new Error(`Invalid APP_AREA: "${rawArea}". Allowed: ${ALLOWED_AREAS.join(', ')}`);
  }

  return {
    testEnv: rawEnv,
    appArea: rawArea,
  };
}

function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }

  const file = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(file) as T;
}

export function loadAreaData(context: RuntimeContext): LoadedData {
  const baseDir = path.join(process.cwd(), 'data', context.testEnv, context.appArea);
  const authFilePath = path.join(baseDir, 'auth.json');
  const testDataFilePath = path.join(baseDir, 'test-data.json');
  const authData = validateAuthDataFile(readJson<unknown>(authFilePath));
  const testData = validateTestDataFile(readJson<unknown>(testDataFilePath));

  if (authData.environment !== context.testEnv || authData.area !== context.appArea) {
    throw new Error('Контекст запуску не збігається з даними у auth.json');
  }

  if (testData.environment !== context.testEnv || testData.area !== context.appArea) {
    throw new Error('Контекст запуску не збігається з даними у test-data.json');
  }

  return {
    authData,
    testData,
  };
}
