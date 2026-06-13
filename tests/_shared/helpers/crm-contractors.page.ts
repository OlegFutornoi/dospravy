import { expect, type Locator, type Page } from '@playwright/test';
import type { GeneratedCrmContractorData } from '../factories/crm-contractor.factory';

export class CrmContractorsPage {
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

  get contractorsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Кандидати' });
  }

  get activeMenuItem(): Locator {
    return this.page.locator('aside [role="menuitem"].ant-menu-item-selected');
  }

  get newContractorButton(): Locator {
    return this.page.getByRole('button', { name: 'Новий кандидат' });
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Пошук...');
  }

  get contractorModal(): Locator {
    return this.page.locator('.ant-modal.contractor-create');
  }

  get phoneInput(): Locator {
    return this.contractorModal.locator('#phone');
  }

  get viberCheckbox(): Locator {
    return this.contractorModal.locator('#has_viber');
  }

  get messengerButtons(): Locator {
    return this.contractorModal.locator('label.messenger-btn');
  }

  get viberButton(): Locator {
    return this.messengerButtons.nth(0);
  }

  get telegramCheckbox(): Locator {
    return this.contractorModal.locator('#has_telegram');
  }

  get telegramButton(): Locator {
    return this.messengerButtons.nth(1);
  }

  get whatsappCheckbox(): Locator {
    return this.contractorModal.locator('#has_whatsapp');
  }

  get whatsappButton(): Locator {
    return this.messengerButtons.nth(2);
  }

  get firstNameInput(): Locator {
    return this.contractorModal.locator('#first_name');
  }

  get lastNameInput(): Locator {
    return this.contractorModal.locator('#last_name');
  }

  get cityInput(): Locator {
    return this.contractorModal.locator('#city_desired');
  }

  get commentInput(): Locator {
    return this.contractorModal.locator('#initial_note');
  }

  get addContractorButton(): Locator {
    return this.contractorModal.getByRole('button', { name: 'Додати кандидата' });
  }

  get cancelContractorButton(): Locator {
    return this.contractorModal.getByRole('button', { name: 'Скасувати' });
  }

  private formItemByFieldId(fieldId: string): Locator {
    return this.contractorModal
      .locator(`label[for="${fieldId}"]`)
      .locator('xpath=ancestor::div[contains(@class,"ant-form-item")]')
      .first();
  }

  private selectContainerByFieldId(fieldId: string): Locator {
    return this.formItemByFieldId(fieldId).locator('.ant-select').first();
  }

  private selectSelectorByFieldId(fieldId: string): Locator {
    return this.selectContainerByFieldId(fieldId).locator('.ant-select-selector').first();
  }

  private activeDropdown(): Locator {
    return this.page
      .locator('.ant-select-dropdown')
      .filter({ has: this.page.locator('.ant-select-item') })
      .last();
  }

  private activeDropdownOption(text: string): Locator {
    return this.page
      .locator('.ant-select-dropdown .ant-select-item-option:not(.ant-select-item-option-disabled)')
      .filter({ hasText: text })
      .first();
  }

  private async contractorRowTexts(): Promise<string[]> {
    return this.page
      .locator('.MuiTableRow-root')
      .evaluateAll((rows) => rows.map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? ''));
  }

  async goto(): Promise<void> {
    await this.page.goto('/contractors');
    await this.expectLoaded();
    this.log('Відкрито CRM сторінку кандидатів');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.contractorsHeading).toBeVisible({ timeout: 15_000 });
    await expect(this.activeMenuItem).toHaveAttribute('title', 'Кандидати');
    await expect(this.newContractorButton).toBeVisible({ timeout: 15_000 });
    await expect(this.searchInput).toBeVisible({ timeout: 15_000 });
    this.log('Сторінка contractors завантажена');
  }

  async openCreateContractorModal(): Promise<void> {
    await this.newContractorButton.click();
    await expect(this.contractorModal).toBeVisible({ timeout: 15_000 });
    await expect(this.phoneInput).toBeVisible({ timeout: 15_000 });
    this.log('Відкрито модальне вікно "Новий кандидат"');
  }

  async selectSingleOption(fieldId: 'source' | 'gender', optionText: string): Promise<void> {
    await this.selectSelectorByFieldId(fieldId).click();
    await expect(this.activeDropdown()).toBeVisible({ timeout: 10_000 });
    await this.activeDropdownOption(optionText).click();
    this.log(`Для поля "${fieldId}" обрано значення "${optionText}"`);
  }

  async selectSpecialization(optionText: string): Promise<void> {
    const fieldId = 'categories';
    const selectContainer = this.selectContainerByFieldId(fieldId);
    await this.selectSelectorByFieldId(fieldId).click();

    const searchInput = selectContainer.locator('.ant-select-selection-search-input').first();
    await searchInput.fill(optionText);
    await expect(this.activeDropdown()).toBeVisible({ timeout: 10_000 });
    await this.activeDropdownOption(optionText).click();
    this.log(`Для поля "Спеціалізації" обрано активне значення "${optionText}"`);
  }

  async enableAllMessengers(): Promise<void> {
    if (!(await this.viberCheckbox.isChecked())) {
      await this.viberButton.click();
    }

    if (!(await this.telegramCheckbox.isChecked())) {
      await this.telegramButton.click();
    }

    if (!(await this.whatsappCheckbox.isChecked())) {
      await this.whatsappButton.click();
    }

    await expect(this.viberCheckbox).toBeChecked();
    await expect(this.telegramCheckbox).toBeChecked();
    await expect(this.whatsappCheckbox).toBeChecked();
    this.log('Увімкнено всі месенджери: Viber, Telegram, WhatsApp');
  }

  async fillPhone(phone: string): Promise<void> {
    await this.phoneInput.click();
    await this.phoneInput.press('Meta+A');
    await this.phoneInput.press('Backspace');
    await this.phoneInput.pressSequentially(phone);
    this.log(`Введено телефон без стартового нуля для маски: "${phone}"`);
  }

  async fillCreateContractorForm(contractor: GeneratedCrmContractorData): Promise<void> {
    await this.fillPhone(contractor.phone);
    await this.enableAllMessengers();
    await this.selectSingleOption('source', contractor.source);
    await this.firstNameInput.fill(contractor.firstName);
    await this.lastNameInput.fill(contractor.lastName);
    await this.selectSingleOption('gender', contractor.gender);
    await this.cityInput.fill(contractor.city);
    await this.selectSpecialization(contractor.specialization);
    await this.commentInput.fill(contractor.comment);
    this.log(
      `Заповнено форму нового кандидата: fullName="${contractor.fullName}", phone="${contractor.phone}", city="${contractor.city}"`,
    );
  }

  async submitCreateContractorForm(): Promise<void> {
    await expect(this.addContractorButton).toBeEnabled();
    await this.addContractorButton.click();
    await expect(this.contractorModal).toBeHidden({ timeout: 15_000 });
    this.log('Натиснуто "Додати кандидата" і модальне вікно закрито');
  }

  async searchContractor(fullName: string): Promise<void> {
    await expect(this.searchInput).toBeVisible({ timeout: 15_000 });
    await this.searchInput.fill(fullName);
    await this.searchInput.press('Enter');
    this.log(`Виконано пошук кандидата за запитом "${fullName}"`);
  }

  async expectContractorVisibleInTable(contractor: GeneratedCrmContractorData): Promise<void> {
    let matchedRowText = '';

    await expect
      .poll(
        async () => {
          const rowTexts = await this.contractorRowTexts();
          const matchedRow = rowTexts.find((rowText) => {
            const normalizedRow = this.normalizeText(rowText);
            const rowDigits = normalizedRow.replace(/\D/g, '');

            return (
              normalizedRow.includes(contractor.fullName) &&
              rowDigits.includes(contractor.phoneDigits)
            );
          });

          matchedRowText = matchedRow ?? '';
          return Boolean(matchedRow);
        },
        {
          timeout: 15_000,
          message: `Після пошуку в таблиці повинен з'явитися контрактор "${contractor.fullName}" з телефоном "${contractor.phone}"`,
        },
      )
      .toBe(true);

    expect(matchedRowText).toContain(contractor.city);
    expect(matchedRowText).toContain(contractor.source);
    this.log(`У таблиці знайдено створеного кандидата: ${matchedRowText}`);
  }
}
