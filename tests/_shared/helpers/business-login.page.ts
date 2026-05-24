import { expect, type Page } from '@playwright/test';

export class BusinessLoginPage {
  constructor(private readonly page: Page) {}

  private getLogContext(): string {
    const currentUrl = this.page.url();
    const pathMatch = currentUrl.match(/^https?:\/\/[^/]+(\/[^?#]*)/);
    const pathname = pathMatch?.[1] ?? currentUrl;
    const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    return `path: ${normalizedPath}`;
  }

  private log(message: string): void {
    console.log(`[E2E] ${message} | ${this.getLogContext()}`);
  }

  private get loginHeading() {
    return this.page.getByRole('heading', { name: 'Увійти' });
  }

  private get emailTab() {
    return this.page.getByRole('button', { name: 'Email та пароль' });
  }

  private get phoneTab() {
    return this.page.getByRole('button', { name: 'Телефон' });
  }

  private get emailInput() {
    return this.page.getByLabel('Email');
  }

  private get passwordInput() {
    return this.page.getByLabel('Пароль');
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: 'Увійти' });
  }

  private get forgotPasswordButton() {
    return this.page.getByRole('button', { name: 'Забули пароль?' });
  }

  private get phoneInput() {
    return this.page
      .locator('form .form-group')
      .filter({ hasText: 'Номер телефону' })
      .locator('input');
  }

  private get getCodeButton() {
    return this.page.getByRole('button', { name: 'Отримати код' });
  }

  private get otpHeading() {
    return this.page.getByRole('heading', { name: /Підтвердження(\s+входу)?/ });
  }

  private get otpInputs() {
    return this.page.locator('.login-otp input[inputmode="numeric"]');
  }

  private get resetPasswordHeading() {
    return this.page.getByRole('heading', { name: 'Оновлення паролю' });
  }

  private get newPasswordHeading() {
    return this.page.getByRole('heading', { name: 'Новий пароль' });
  }

  private get resetPhoneInput() {
    return this.page
      .locator('form .form-group')
      .filter({ hasText: 'Номер телефону' })
      .locator('input');
  }

  private get savePasswordButton() {
    return this.page.getByRole('button', { name: 'Зберегти пароль' });
  }

  private get newPasswordInput() {
    return this.page.getByLabel('Новий пароль');
  }

  private get confirmPasswordInput() {
    return this.page.getByLabel('Підтвердіть пароль');
  }

  private get workspaceTab() {
    return this.page.getByRole('tab', { name: 'Замовлення' });
  }

  private get logoutButton() {
    return this.page.locator('.btn-logout');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.loginHeading).toBeVisible();
    await expect(this.emailTab).toBeVisible();
    await expect(this.phoneTab).toBeVisible();
    this.log('Відкрито сторінку логіну');
  }

  async loginByEmail(email: string, password: string): Promise<void> {
    await this.emailTab.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    this.log(`Логін через email: email="${email}", password="${password}"`);
    await this.submitButton.click();
  }

  async openForgotPassword(): Promise<void> {
    await this.emailTab.click();
    await this.forgotPasswordButton.click();
    await expect(this.resetPasswordHeading).toBeVisible();
  }

  async openForgotPasswordOtp(phone: string): Promise<void> {
    await this.openForgotPassword();
    await expect(this.resetPhoneInput).toBeVisible();
    await this.resetPhoneInput.fill(phone);
    this.log(`Відновлення пароля: введено телефон "${phone}"`);
    await this.getCodeButton.click();
    await expect(this.resetPasswordHeading).toBeVisible();
    await expect(this.otpInputs.first()).toBeVisible({ timeout: 30_000 });
  }

  async openPhoneOtp(phone: string): Promise<void> {
    await this.phoneTab.click();
    await expect(this.phoneInput).toBeVisible();
    await this.phoneInput.fill(phone);
    this.log(`Логін через телефон: введено номер "${phone}"`);
    await this.getCodeButton.click();
    try {
      await expect(this.otpHeading).toBeVisible({ timeout: 30_000 });
    } catch {
      await expect(this.otpInputs.first()).toBeVisible({ timeout: 30_000 });
    }
  }

  async submitOtp(code: string): Promise<void> {
    const normalized = code.trim();
    await expect(this.otpInputs).toHaveCount(normalized.length);
    this.log(`Введено OTP код "${normalized}"`);

    for (let i = 0; i < normalized.length; i += 1) {
      await this.otpInputs.nth(i).fill(normalized[i]);
    }

    await this.submitButton.click();
  }

  async expectAuthorized(): Promise<void> {
    await expect(this.page).toHaveURL(/\/workspace$/);
    await expect(this.workspaceTab).toBeVisible();
    await expect(this.logoutButton).toBeVisible();
  }

  async expectStillOnLogin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login$/);
  }

  async expectOtpStepVisible(): Promise<void> {
    await expect(this.otpHeading).toBeVisible();
  }

  async expectNewPasswordStepVisible(): Promise<void> {
    await expect(this.newPasswordHeading).toBeVisible();
    await expect(this.newPasswordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.savePasswordButton).toBeVisible();
  }

  async saveNewPassword(password: string): Promise<void> {
    await this.newPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    this.log(`Збереження нового пароля "${password}"`);
    await this.savePasswordButton.click();
  }
}
