import { test, expect } from '../../../_shared/fixtures/app.fixture';
import { BusinessLoginPage } from '../../../_shared/helpers/business-login.page';

test.describe('Регресія: логін business', () => {
  test('показує валідацію для порожніх email і пароля', async ({ page }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await page.getByRole('button', { name: 'Увійти' }).click();

    await expect(page.getByText("Поле обов'язкове для заповнення")).toHaveCount(2);
    await loginPage.expectStillOnLogin();
  });

  test('не авторизує з невалідною комбінацією email і пароля', async ({ page, authData }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await loginPage.loginByEmail(
      authData.auth.emailPassword.email,
      `${authData.auth.emailPassword.password}!`,
    );
    await loginPage.expectStillOnLogin();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('не авторизує з невалідним otp кодом', async ({ page, authData }) => {
    const loginPage = new BusinessLoginPage(page);
    const validOtp = authData.auth.phoneOtp.otp;
    const invalidOtp = validOtp
      .split('')
      .map((digit) => ((Number(digit) + 1) % 10).toString())
      .join('');

    await loginPage.goto();
    await loginPage.openPhoneOtp(authData.auth.phoneOtp.phone);
    await loginPage.submitOtp(invalidOtp);

    await loginPage.expectOtpStepVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('проходить повний флоу "Забули пароль?" із тим самим паролем', async ({
    page,
    authData,
  }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await loginPage.openForgotPasswordOtp(authData.auth.phoneOtp.phone);
    await loginPage.submitOtp(authData.auth.phoneOtp.otp);

    await loginPage.expectNewPasswordStepVisible();
    await expect(page.getByText(authData.auth.emailPassword.email)).toBeVisible();
    await loginPage.saveNewPassword(authData.auth.emailPassword.password);
    await loginPage.expectAuthorized();
  });
});
