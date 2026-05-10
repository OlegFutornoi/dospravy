import { expect, test as base } from '@playwright/test';
import {
  getRuntimeContext,
  loadAreaData,
  type AuthDataFile,
  type RuntimeContext,
  type TestDataFile,
} from '../../../src/utils/data/load-test-data';

type AppFixtures = {
  authData: AuthDataFile;
  testData: TestDataFile;
};

type WorkerFixtures = {
  runtimeContext: RuntimeContext;
  loadedData: {
    authData: AuthDataFile;
    testData: TestDataFile;
  };
};

export const test = base.extend<AppFixtures, WorkerFixtures>({
  runtimeContext: [
    async ({}, use) => {
      await use(getRuntimeContext());
    },
    { scope: 'worker' },
  ],
  loadedData: [
    async ({ runtimeContext }, use) => {
      await use(loadAreaData(runtimeContext));
    },
    { scope: 'worker' },
  ],
  authData: async ({ loadedData }, use) => {
    await use(loadedData.authData);
  },
  testData: async ({ loadedData }, use) => {
    await use(loadedData.testData);
  },
});

export { expect };
