import { expect, type Locator, type Page } from '@playwright/test';
import type {
  GeneratedCrmCompanyContact,
  GeneratedCrmCompanyData,
} from '../factories/crm-company.factory';

type CreateCompanySubmitResult =
  | { status: 'saved' }
  | {
      status: 'validation_error';
      messages: string[];
    };

export class CrmCompaniesPage {
  constructor(private readonly page: Page) {}

  private normalizeText(value: string | null | undefined): string {
    return value?.replace(/\s+/g, ' ').trim() ?? '';
  }

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

  get companiesHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Замовники' });
  }

  get activeMenuItem(): Locator {
    return this.page.locator('aside [role="menuitem"].ant-menu-item-selected');
  }

  get createCompanyButton(): Locator {
    return this.page.getByRole('button', { name: '+ Створити компанію' });
  }

  get createCompanyTitle(): Locator {
    return this.page.getByText('Додавання Компанії-Клієнта');
  }

  get companyNameInput(): Locator {
    return this.page.locator('#name');
  }

  get descriptionInput(): Locator {
    return this.page.locator('#description');
  }

  get securityNameInput(): Locator {
    return this.page.locator('#security_name');
  }

  get securityContactInput(): Locator {
    return this.page.locator('#security_contact');
  }

  get addHrButton(): Locator {
    return this.page.getByRole('button', { name: '+ Додати HR компанії' });
  }

  get saveCompanyButton(): Locator {
    return this.page.getByRole('button', { name: 'Зберегти компанію' });
  }

  get successCloseButton(): Locator {
    return this.page.getByRole('button', { name: 'Close' });
  }

  get contactCards(): Locator {
    return this.page.locator('.contact-card');
  }

  get companiesTableRows(): Locator {
    return this.page.locator('tbody tr');
  }

  private contactInput(contactIndex: number, field: 'name' | 'email' | 'phone'): Locator {
    return this.page.locator(`#contacts_${contactIndex}_${field}`);
  }

  private supervisorInput(
    contactIndex: number,
    supervisorIndex: number,
    field: 'name' | 'email' | 'phone',
  ): Locator {
    return this.page.locator(`#contacts_${contactIndex}_supervisors_${supervisorIndex}_${field}`);
  }

  private contactCard(contactIndex: number): Locator {
    return this.contactCards.nth(contactIndex);
  }

  private addSupervisorButton(contactIndex: number): Locator {
    return this.contactCard(contactIndex).getByRole('button', { name: '+ Додати супервайзера' });
  }

  private async companyTableRowTexts(): Promise<string[]> {
    return this.companiesTableRows.evaluateAll((rows) =>
      rows.map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
    );
  }

  private async fillMaskedPhone(input: Locator, phone: string): Promise<void> {
    await input.click();
    await input.press('Meta+A');
    await input.press('Backspace');
    await input.pressSequentially(phone);
  }

  async goto(): Promise<void> {
    await this.page.goto('/companies');
    await this.expectLoaded();
    this.log('Відкрито CRM сторінку компаній');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.companiesHeading).toBeVisible({ timeout: 15_000 });
    await expect(this.activeMenuItem).toHaveAttribute('title', 'Сейлз (створення компанії)');
    await expect(this.createCompanyButton).toBeVisible({ timeout: 15_000 });
    this.log('Сторінка companies завантажена');
  }

  async openCreateCompanyForm(): Promise<void> {
    await this.createCompanyButton.click();
    await expect(this.createCompanyTitle).toBeVisible({ timeout: 15_000 });
    await expect(this.companyNameInput).toBeVisible({ timeout: 15_000 });
    this.log('Відкрито форму створення компанії');
  }

  async fillCompanyBaseInfo(company: GeneratedCrmCompanyData): Promise<void> {
    await this.companyNameInput.fill(company.companyName);
    await this.descriptionInput.fill(company.description);
    await this.securityNameInput.fill(company.securityContactName);
    await this.securityContactInput.fill(company.securityContactFormattedPhone);
    this.log(
      `Заповнено основну інформацію компанії: name="${company.companyName}", securityContact="${company.securityContactFormattedPhone}"`,
    );
  }

  async fillHrContact(contactIndex: number, contact: GeneratedCrmCompanyContact): Promise<void> {
    await expect(this.contactInput(contactIndex, 'name')).toBeVisible({ timeout: 10_000 });
    await this.contactInput(contactIndex, 'name').fill(contact.name);
    await this.contactInput(contactIndex, 'email').fill(contact.email);
    await this.fillMaskedPhone(this.contactInput(contactIndex, 'phone'), contact.phone);
    this.log(
      `Заповнено HR контакт index=${contactIndex}: name="${contact.name}", email="${contact.email}", phone="${contact.phone}"`,
    );
  }

  async addSecondHrContact(contact: GeneratedCrmCompanyContact): Promise<void> {
    await this.addHrButton.click();
    await expect(this.contactInput(1, 'name')).toBeVisible({ timeout: 10_000 });
    await this.fillHrContact(1, contact);
  }

  async addSupervisorForHr(
    contactIndex: number,
    supervisor: GeneratedCrmCompanyContact,
  ): Promise<void> {
    await this.addSupervisorButton(contactIndex).click();
    await expect(this.supervisorInput(contactIndex, 0, 'name')).toBeVisible({ timeout: 10_000 });
    await this.supervisorInput(contactIndex, 0, 'name').fill(supervisor.name);
    await this.supervisorInput(contactIndex, 0, 'email').fill(supervisor.email);
    await this.fillMaskedPhone(this.supervisorInput(contactIndex, 0, 'phone'), supervisor.phone);
    this.log(
      `Заповнено супервайзера для HR index=${contactIndex}: name="${supervisor.name}", email="${supervisor.email}", phone="${supervisor.phone}"`,
    );
  }

  async fillCreateCompanyForm(company: GeneratedCrmCompanyData): Promise<void> {
    await this.fillCompanyBaseInfo(company);
    await this.fillHrContact(0, company.primaryHr);
    await this.addSecondHrContact(company.secondaryHr);
    await this.addSupervisorForHr(0, company.supervisor);
    this.log(`Форму створення компанії повністю заповнено для "${company.companyName}"`);
  }

  async replaceRetryableChannels(company: GeneratedCrmCompanyData): Promise<void> {
    await this.companyNameInput.fill(company.companyName);
    await this.securityContactInput.fill(company.securityContactFormattedPhone);
    await this.contactInput(0, 'email').fill(company.primaryHr.email);
    await this.fillMaskedPhone(this.contactInput(0, 'phone'), company.primaryHr.phone);
    await this.contactInput(1, 'email').fill(company.secondaryHr.email);
    await this.fillMaskedPhone(this.contactInput(1, 'phone'), company.secondaryHr.phone);
    await this.supervisorInput(0, 0, 'email').fill(company.supervisor.email);
    await this.fillMaskedPhone(this.supervisorInput(0, 0, 'phone'), company.supervisor.phone);
    this.log(
      `Оновлено retryable-поля для повторної спроби збереження компанії "${company.companyName}"`,
    );
  }

  async submitCreateCompanyForm(): Promise<CreateCompanySubmitResult> {
    await expect(this.saveCompanyButton).toBeEnabled();
    await this.saveCompanyButton.click();

    const savedViaCloseButton = await this.successCloseButton
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (savedViaCloseButton) {
      await this.successCloseButton.click();
      await expect(this.createCompanyButton).toBeVisible({ timeout: 15_000 });
      this.log('Компанію успішно збережено і success popup закрито');
      return { status: 'saved' };
    }

    const messages = await this.collectVisibleValidationMessages();
    this.log(
      `Після збереження компанії отримано валідаційні повідомлення: ${messages.join(' | ')}`,
    );
    return {
      status: 'validation_error',
      messages,
    };
  }

  async collectVisibleValidationMessages(): Promise<string[]> {
    const texts = await this.page
      .locator(
        '.ant-form-item-explain-error, .ant-message-notice-content, .ant-notification-notice-message, .ant-notification-notice-description',
      )
      .evaluateAll((nodes) =>
        nodes
          .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
          .filter((text) => text.length > 0),
      );

    return [...new Set(texts)];
  }

  isRetryableDuplicateValidation(messages: string[]): boolean {
    return messages.some(
      (message) =>
        /(вже існує|уже існує|already exists|already taken|використовується)/i.test(message) &&
        /(email|пошта|телефон|phone|номер|ім'ям|ім’ям|name|клієнт)/i.test(message),
    );
  }

  async expectCompanyVisibleInTable(company: GeneratedCrmCompanyData): Promise<void> {
    let matchedRowText = '';

    await expect
      .poll(
        async () => {
          const rowTexts = await this.companyTableRowTexts();
          const matchedRow = rowTexts.find((rowText) => {
            const normalizedRow = this.normalizeText(rowText);
            const rowDigits = normalizedRow.replace(/\D/g, '');

            return (
              normalizedRow.includes(company.companyName) &&
              normalizedRow.includes(company.primaryHr.email) &&
              rowDigits.includes(company.primaryHr.phoneDigits)
            );
          });

          matchedRowText = matchedRow ?? '';
          return Boolean(matchedRow);
        },
        {
          timeout: 15_000,
          message: `Після створення в таблиці повинен з'явитися запис компанії "${company.companyName}" з email "${company.primaryHr.email}"`,
        },
      )
      .toBe(true);

    expect(matchedRowText).toContain(company.primaryHr.name);
    this.log(`У таблиці знайдено створену компанію: ${matchedRowText}`);
  }
}
