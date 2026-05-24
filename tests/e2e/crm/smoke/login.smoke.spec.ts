import { test, expect } from '../../../_shared/fixtures/app.fixture';
import { CrmLoginPage } from '../../../_shared/helpers/crm-login.page';

test.describe('Смок: логін crm', () => {
  test('авторизує через email і пароль', async ({ page, authData }) => {
    const loginPage = new CrmLoginPage(page);

    await loginPage.goto();
    const response = await loginPage.loginByEmail(
      authData.auth.emailPassword.email,
      authData.auth.emailPassword.password,
    );

    expect(response.status(), 'CRM login API повинно повернути 200').toBe(200);
    await loginPage.expectAuthorized();
  });
});
