import { expect, test as base } from '@playwright/test';
import {
  getCombinedRuntimeContext,
  loadCombinedData,
  type CombinedFlowDataFile,
  type CombinedRuntimeContext,
} from '../../../src/utils/data/load-combined-flow-data';
import type { AuthDataFile, TestDataFile } from '../../../src/utils/data/load-test-data';

type CombinedAppFixtures = {
  businessAuthData: AuthDataFile;
  businessTestData: TestDataFile;
  crmAuthData: AuthDataFile;
  crmTestData: TestDataFile;
  combinedFlowData: CombinedFlowDataFile;
};

type CombinedWorkerFixtures = {
  runtimeContext: CombinedRuntimeContext;
  combinedLoadedData: {
    businessAuthData: AuthDataFile;
    businessTestData: TestDataFile;
    crmAuthData: AuthDataFile;
    crmTestData: TestDataFile;
    combinedFlowData: CombinedFlowDataFile;
  };
};

export const test = base.extend<CombinedAppFixtures, CombinedWorkerFixtures>({
  runtimeContext: [
    async ({}, use) => {
      await use(getCombinedRuntimeContext());
    },
    { scope: 'worker' },
  ],
  combinedLoadedData: [
    async ({ runtimeContext }, use) => {
      await use(loadCombinedData(runtimeContext.testEnv));
    },
    { scope: 'worker' },
  ],
  businessAuthData: async ({ combinedLoadedData }, use) => {
    await use(combinedLoadedData.businessAuthData);
  },
  businessTestData: async ({ combinedLoadedData }, use) => {
    await use(combinedLoadedData.businessTestData);
  },
  crmAuthData: async ({ combinedLoadedData }, use) => {
    await use(combinedLoadedData.crmAuthData);
  },
  crmTestData: async ({ combinedLoadedData }, use) => {
    await use(combinedLoadedData.crmTestData);
  },
  combinedFlowData: async ({ combinedLoadedData }, use) => {
    await use(combinedLoadedData.combinedFlowData);
  },
});

export { expect };
