import { test, expect } from '../../../_shared/fixtures/app.fixture';
import { BusinessLoginPage } from '../../../_shared/helpers/business-login.page';

test.describe('Смок: логін business', () => {
  test('відкриває сторінку логіну з двома способами авторизації', async ({ page }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();

    await expect(page.getByRole('button', { name: 'Email та пароль' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Телефон' })).toBeVisible();
  });

  test('авторизує через email і пароль', async ({ page, authData }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await loginPage.loginByEmail(
      authData.auth.emailPassword.email,
      authData.auth.emailPassword.password,
    );
    await loginPage.expectAuthorized();
    await expect(page).toHaveURL(/\/workspace$/);
  });

  test('авторизує через телефон і otp код', async ({ page, authData }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await loginPage.openPhoneOtp(authData.auth.phoneOtp.phone);
    await loginPage.submitOtp(authData.auth.phoneOtp.otp);
    await loginPage.expectAuthorized();
    await expect(page).toHaveURL(/\/workspace$/);
  });
});
