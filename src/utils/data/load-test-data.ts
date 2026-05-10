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
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    secondary: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
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

  return {
    authData: readJson<AuthDataFile>(authFilePath),
    testData: readJson<TestDataFile>(testDataFilePath),
  };
}
