import { test as base, expect } from './app.fixture';
import { ensureBusinessCabinetByPhoneOtp } from '../helpers/business-cabinet-auth.flow';

export const test = base.extend({
  page: async ({ page, authData, runtimeContext }, use) => {
    if (runtimeContext.appArea !== 'business') {
      throw new Error('Цей fixture призначений тільки для business тестів');
    }

    await ensureBusinessCabinetByPhoneOtp(page, authData);
    await use(page);
  },
});

export { expect };
