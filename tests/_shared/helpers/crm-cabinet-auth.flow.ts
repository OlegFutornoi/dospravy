import { expect, type Page } from '@playwright/test';
import type { AuthDataFile } from '../../../src/utils/data/load-test-data';
import { CrmLoginPage } from './crm-login.page';

export async function ensureCrmCabinetByEmailPassword(page: Page, authData: AuthDataFile) {
  const loginPage = new CrmLoginPage(page);

  await page.goto('/');

  const loginHeading = page.getByRole('heading', { name: 'Увійти' });
  const authorizedShell = page.locator('.private-layout, .ant-layout-sider, aside, nav').first();

  if (await authorizedShell.isVisible().catch(() => false)) {
    return;
  }

  await expect(loginHeading).toBeVisible();
  const response = await loginPage.loginByEmail(
    authData.auth.emailPassword.email,
    authData.auth.emailPassword.password,
  );

  expect(response.status(), 'CRM login API повинно повернути 200').toBe(200);
  await loginPage.expectAuthorized();
}
