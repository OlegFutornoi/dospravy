import { expect, type Page, type Response } from '@playwright/test';

export class CrmLoginPage {
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

  private get emailInput() {
    return this.page.getByLabel('Email');
  }

  private get passwordInput() {
    return this.page.getByLabel('Пароль');
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: 'Увійти' });
  }

  private get authorizedShell() {
    return this.page.locator('.private-layout, .ant-layout-sider, aside, nav').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.expectLoginPageVisible();
    this.log('Відкрито CRM сторінку логіну');
  }

  async expectLoginPageVisible(): Promise<void> {
    await expect(this.loginHeading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    this.log(`Введено email "${email}"`);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
    this.log(`Введено пароль "${password}"`);
  }

  async submit(): Promise<Response> {
    const loginResponsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/users/login/') && response.request().method() === 'POST',
    );

    await this.submitButton.click();
    const response = await loginResponsePromise;
    this.log(`Натиснуто "Увійти", статус login API = ${response.status()}`);
    return response;
  }

  async loginByEmail(email: string, password: string): Promise<Response> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    return this.submit();
  }

  async expectAuthorized(): Promise<void> {
    await expect
      .poll(() => this.page.url(), {
        timeout: 15_000,
        message: 'Після успішного логіну сторінка повинна перейти з /login у CRM кабінет',
      })
      .not.toMatch(/\/login\/?(\?.*)?$/);
    await expect(this.loginHeading).toHaveCount(0);
    await expect(this.authorizedShell).toBeVisible({ timeout: 15_000 });
    this.log('Успішно відкрито CRM кабінет');
  }

  async expectLoginRejected(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login\/?(\?.*)?$/);
    await expect(this.loginHeading).toBeVisible();
  }
}
