import type { CabinetArea, TestEnv } from '../../../../src/utils/data/load-test-data';

const APP_BASE_URLS: Record<CabinetArea, Record<TestEnv, string>> = {
  business: {
    dev: 'https://business-dev.dospravy.com.ua/',
    stage: 'https://business-staging.dospravy.com.ua/',
    prod: 'https://business.dospravy.com.ua/',
  },
  crm: {
    dev: 'https://crm-dev.dospravy.com.ua/',
    stage: 'https://crm-staging.dospravy.com.ua/',
    prod: 'https://crm.dospravy.com.ua/',
  },
};

const API_BASE_URLS: Record<TestEnv, string> = {
  dev: 'https://dev.dospravy.com.ua/',
  stage: 'https://staging.dospravy.com.ua/',
  prod: 'https://dospravy.com.ua/',
};

export function getAppBaseUrl(area: CabinetArea, testEnv: TestEnv): string {
  return APP_BASE_URLS[area][testEnv];
}

export function getApiBaseUrl(testEnv: TestEnv): string {
  return API_BASE_URLS[testEnv];
}
