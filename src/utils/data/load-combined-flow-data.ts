import fs from 'node:fs';
import path from 'node:path';
import {
  getRuntimeContext,
  loadCabinetAreaData,
  type AuthDataFile,
  type RuntimeContext,
  type TestDataFile,
  type TestEnv,
} from './load-test-data';

export interface CombinedFlowDataFile {
  environment: TestEnv;
  area: 'combined';
  flows: {
    orderLifecycle: {
      moderationAppearanceTimeoutMs: number;
      maxReloadAttempts: number;
      expectStatusChange: boolean;
    };
  };
}

export interface CombinedLoadedData {
  businessAuthData: AuthDataFile;
  businessTestData: TestDataFile;
  crmAuthData: AuthDataFile;
  crmTestData: TestDataFile;
  combinedFlowData: CombinedFlowDataFile;
}

export interface CombinedRuntimeContext extends RuntimeContext {
  appArea: 'combined';
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

function ensureBoolean(value: unknown, pathName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Поле "${pathName}" має бути булевим значенням`);
  }

  return value;
}

function readJson<T>(filePath: string): T {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent) as T;
}

function validateCombinedFlowDataFile(data: unknown): CombinedFlowDataFile {
  const root = ensureRecord(data, 'combined/test-data.json');
  const flows = ensureRecord(root.flows, 'combined/test-data.json.flows');
  const orderLifecycle = ensureRecord(
    flows.orderLifecycle,
    'combined/test-data.json.flows.orderLifecycle',
  );

  const environment = ensureString(
    root.environment,
    'combined/test-data.json.environment',
  ) as TestEnv;
  const area = ensureString(root.area, 'combined/test-data.json.area');
  if (area !== 'combined') {
    throw new Error('Поле "combined/test-data.json.area" має дорівнювати "combined"');
  }

  return {
    environment,
    area: 'combined',
    flows: {
      orderLifecycle: {
        moderationAppearanceTimeoutMs: ensureNumber(
          orderLifecycle.moderationAppearanceTimeoutMs,
          'combined/test-data.json.flows.orderLifecycle.moderationAppearanceTimeoutMs',
        ),
        maxReloadAttempts: ensureNumber(
          orderLifecycle.maxReloadAttempts,
          'combined/test-data.json.flows.orderLifecycle.maxReloadAttempts',
        ),
        expectStatusChange: ensureBoolean(
          orderLifecycle.expectStatusChange,
          'combined/test-data.json.flows.orderLifecycle.expectStatusChange',
        ),
      },
    },
  };
}

export function getCombinedRuntimeContext(): CombinedRuntimeContext {
  const runtimeContext = getRuntimeContext();
  if (runtimeContext.appArea !== 'combined') {
    throw new Error('Для combined fixture потрібно запускати тести з APP_AREA=combined');
  }

  return {
    ...runtimeContext,
    appArea: 'combined',
  };
}

export function loadCombinedFlowData(testEnv: TestEnv): CombinedFlowDataFile {
  const filePath = path.join(process.cwd(), 'data', testEnv, 'combined', 'test-data.json');
  const combinedFlowData = validateCombinedFlowDataFile(readJson<unknown>(filePath));

  if (combinedFlowData.environment !== testEnv) {
    throw new Error('Контекст запуску не збігається з даними у combined/test-data.json');
  }

  return combinedFlowData;
}

export function loadCombinedData(testEnv: TestEnv): CombinedLoadedData {
  const business = loadCabinetAreaData(testEnv, 'business');
  const crm = loadCabinetAreaData(testEnv, 'crm');
  const combinedFlowData = loadCombinedFlowData(testEnv);

  return {
    businessAuthData: business.authData,
    businessTestData: business.testData,
    crmAuthData: crm.authData,
    crmTestData: crm.testData,
    combinedFlowData,
  };
}
