import { expect, type Page } from '@playwright/test';
import type { AuthDataFile } from '../../../src/utils/data/load-test-data';
import { BusinessLoginPage } from './business-login.page';

export async function ensureBusinessCabinetByPhoneOtp(page: Page, authData: AuthDataFile) {
  await page.goto('/workspace');

  const loginHeading = page.getByRole('heading', { name: 'Увійти' });
  const workspaceTab = page.getByRole('tab', { name: 'Замовлення' });

  const target = await Promise.race([
    workspaceTab.waitFor({ state: 'visible' }).then(() => 'workspace' as const),
    loginHeading.waitFor({ state: 'visible' }).then(() => 'login' as const),
  ]);

  if (target === 'workspace') {
    await expect(page).toHaveURL(/\/workspace\/?(\?.*)?$/);
    return;
  }

  const loginPage = new BusinessLoginPage(page);
  await loginPage.openPhoneOtp(authData.auth.phoneOtp.phone);
  await loginPage.submitOtp(authData.auth.phoneOtp.otp);
  await loginPage.expectAuthorized();
}
