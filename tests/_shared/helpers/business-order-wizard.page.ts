import { expect, type Locator, type Page } from '@playwright/test';
import type { TestDataFile } from '../../../src/utils/data/load-test-data';

export type OrderCreateData = NonNullable<TestDataFile['order']>['create'];

export class BusinessOrderWizardPage {
  constructor(private readonly page: Page) {}

  private get createOrderMenuItem() {
    return this.page.getByRole('menuitem', { name: 'Створення замовлення' });
  }

  private get createOrderHeading() {
    return this.page.getByRole('heading', { name: 'Створення замовлення' });
  }

  private get nextStepButton() {
    return this.page.getByRole('button', { name: 'Наступний крок' });
  }

  private get backButton() {
    return this.page.getByRole('button', { name: 'Назад' });
  }

  private get orderCreatedText() {
    return this.page.getByText(/Замовлення №\s*[\d-]+\s+створено!/);
  }

  private get companyNameInput() {
    return this.page.getByLabel('Назва компанії');
  }

  private get companyShortDescriptionInput() {
    return this.page.getByLabel('Короткий опис компанії');
  }

  private get positionNameInput() {
    return this.page.getByLabel('Назва позиції');
  }

  private get workToDoInput() {
    return this.page.getByLabel('Що потрібно робити');
  }

  private get perksGroup() {
    return this.page.locator('#order_advantages');
  }

  private get genderGroup() {
    return this.page.locator('#gender');
  }

  private get ageFromInput() {
    return this.page.locator('#age_from');
  }

  private get ageToInput() {
    return this.page.locator('#age_to');
  }

  private get candidateCategoriesGroup() {
    return this.page.locator('#proposed_candidates');
  }

  private get keyRequirementsGroup() {
    return this.page.locator('#key_requirements');
  }

  private get thingsToBringInput() {
    return this.page.getByLabel('Що з собою мати на зміну');
  }

  private get requiredDocumentsGroup() {
    return this.page.locator('#required_documents_parents');
  }

  private get otherDocumentsSelect() {
    return this.page.getByText('Інші документи').locator('..').locator('[role="combobox"]');
  }

  private get experienceGroup() {
    return this.page.locator('#experience_requirements2');
  }

  private get cityInput() {
    return this.page.getByLabel('Місто');
  }

  private get streetInput() {
    return this.page.getByLabel('Вулиця');
  }

  private get buildingNumberInput() {
    return this.page.getByLabel('Номер будинку');
  }

  private get riverBankSelect() {
    return this.page.getByLabel('Берег (для Києва)');
  }

  private get metroSelect() {
    return this.page.getByLabel('Найближче метро');
  }

  private get districtInput() {
    return this.page.getByLabel('Район');
  }

  private get landmarksInput() {
    return this.page.getByLabel('Орієнтири (важливо вказати)');
  }

  private get howToGetThereInput() {
    return this.page.getByLabel('Як дістатись (важливо вказати)');
  }

  private get hourlyRateInput() {
    return this.page.getByLabel('Оплата (грн/год)');
  }

  private get workPeriodInput() {
    return this.page.getByLabel('Період роботи');
  }

  private get shiftStartInput() {
    return this.page.getByLabel('Початок зміни 1');
  }

  private get shiftEndInput() {
    return this.page.getByLabel('Кінець зміни 1');
  }

  private get employeesCountInput() {
    return this.page.getByLabel('К-сть працівників');
  }

  private get orderButton() {
    return this.page.getByRole('button', { name: 'Замовити' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/workspace');
    await expect(this.createOrderMenuItem).toBeVisible();
    await this.createOrderMenuItem.click();
    await expect(this.createOrderHeading).toBeVisible();
  }

  async waitForCompanyInfoLoaded(): Promise<void> {
    await expect(this.companyNameInput).toBeVisible();
    await expect(this.companyNameInput).toHaveValue(/.+/);
    await expect(this.companyShortDescriptionInput).toBeVisible();
    await expect(this.companyShortDescriptionInput).toHaveValue(/.+/);
  }

  async goNext(): Promise<void> {
    await expect(this.nextStepButton).toBeEnabled();
    await this.nextStepButton.click();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  private normalizeOptionLabel(value: string): string[] {
    const trimmed = value.trim();
    const ua = trimmed.replaceAll('i', 'і').replaceAll('I', 'І');
    const latin = trimmed.replaceAll('і', 'i').replaceAll('І', 'I');

    return Array.from(new Set([trimmed, ua, latin]));
  }

  private async selectCheckboxInGroup(group: Locator, label: string): Promise<void> {
    for (const candidate of this.normalizeOptionLabel(label)) {
      const option = group.locator('label').filter({ hasText: candidate }).first();
      try {
        await expect(option).toBeVisible();
        await option.click();
        const input = option.locator('input[type="checkbox"]');
        if ((await input.count()) > 0) {
          await expect(input).toBeChecked();
        }
        return;
      } catch {
        // noop
      }
    }

    const option = group.locator('label').filter({ hasText: label }).first();
    await expect(option).toBeVisible();
    await option.click();
    const input = option.locator('input[type="checkbox"]');
    if ((await input.count()) > 0) {
      await expect(input).toBeChecked();
    }
  }

  private async selectRadioInGroup(group: Locator, label: string): Promise<void> {
    for (const candidate of this.normalizeOptionLabel(label)) {
      const option = group.locator('label').filter({ hasText: candidate }).first();
      try {
        await expect(option).toBeVisible();
        await option.click();
        const input = option.locator('input[type="radio"]');
        if ((await input.count()) > 0) {
          await expect(input).toBeChecked();
        }
        return;
      } catch {
        // noop
      }
    }

    const option = group.locator('label').filter({ hasText: label }).first();
    await expect(option).toBeVisible();
    await option.click();
    const input = option.locator('input[type="radio"]');
    if ((await input.count()) > 0) {
      await expect(input).toBeChecked();
    }
  }

  private async setTimeValue(input: Locator, value: string): Promise<void> {
    try {
      await input.fill(value);
    } catch {
      await input.click();
      await this.page.getByRole('option', { name: value }).first().click();
    }
  }

  private async selectFirstAutocompleteOption(input: Locator, value: string): Promise<void> {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    const query = parts[0] ? parts[0].toLowerCase() : value.toLowerCase();

    await input.click();
    await input.fill('');
    await input.type(query, { delay: 80 });

    const listId = await input.getAttribute('aria-controls');
    const list = listId ? this.page.locator(`#${listId}`) : this.page;
    const exactOption = list.getByRole('option', { name: value }).first();

    await expect(exactOption).toBeVisible({ timeout: 30_000 });
    await exactOption.click();
  }

  private async expectAutocompleteHasValue(input: Locator, value: string): Promise<void> {
    const selectRoot = input.locator('xpath=ancestor::*[contains(@class,"ant-select")]').first();
    if ((await selectRoot.count()) > 0) {
      await expect(selectRoot.locator('.ant-select-selection-item')).toHaveText(value);
      return;
    }

    await expect(input).toHaveValue(value);
  }

  private async selectFromSelectByTyping(input: Locator, value: string): Promise<void> {
    await input.click();
    await input.fill(value);
    try {
      await this.page.keyboard.press('Enter');
    } catch {
      await this.page.getByRole('option', { name: value }).first().click();
    }
  }

  private formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async fillStep2OrderInfo(data: OrderCreateData): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: 'Інформація про замовлення' }),
    ).toBeVisible();

    await this.selectFirstAutocompleteOption(this.positionNameInput, data.step2.positionName);
    await this.expectAutocompleteHasValue(this.positionNameInput, data.step2.positionName);
    await this.workToDoInput.fill(data.step2.workDescription);

    for (const perk of data.step2.perks) {
      await this.selectCheckboxInGroup(this.perksGroup, perk);
    }

    await this.selectRadioInGroup(this.genderGroup, data.step2.gender);

    await expect(this.ageFromInput).toBeVisible();
    await this.ageFromInput.fill(String(data.step2.ageFrom));
    await this.ageToInput.fill(String(data.step2.ageTo));

    for (const category of data.step2.candidateCategories) {
      await this.selectCheckboxInGroup(this.candidateCategoriesGroup, category);
    }
  }

  async fillStep3Requirements(data: OrderCreateData): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: 'Вимоги до працівника та досвід' }),
    ).toBeVisible({ timeout: 30_000 });

    for (const req of data.step3.keyRequirements) {
      await this.selectCheckboxInGroup(this.keyRequirementsGroup, req);
    }

    await this.thingsToBringInput.fill(data.step3.thingsToBring);

    for (const doc of data.step3.requiredDocuments) {
      await this.selectCheckboxInGroup(this.requiredDocumentsGroup, doc);
    }

    if (data.step3.otherDocuments.length > 0 && (await this.otherDocumentsSelect.count()) > 0) {
      await this.otherDocumentsSelect.click();
      for (const item of data.step3.otherDocuments) {
        await this.page.getByRole('option', { name: item }).click();
      }
      await this.page.keyboard.press('Escape');
    }

    await this.selectRadioInGroup(this.experienceGroup, data.step3.experience);
  }

  async fillStep4WorkPlace(data: OrderCreateData): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Місце роботи' })).toBeVisible();

    await this.selectFirstAutocompleteOption(this.cityInput, data.step4.city);
    await this.selectFirstAutocompleteOption(this.streetInput, data.step4.street);
    await this.buildingNumberInput.fill(data.step4.buildingNumber);

    await this.riverBankSelect.click();
    await this.page.getByRole('option', { name: data.step4.riverBank }).click();

    await this.selectFromSelectByTyping(this.metroSelect, data.step4.metro);

    await this.districtInput.fill(data.step4.district);
    await this.landmarksInput.fill(data.step4.landmarks);
    await this.howToGetThereInput.fill(data.step4.howToGetThere);
  }

  async fillStep5Schedule(data: OrderCreateData): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Графік та години роботи' })).toBeVisible();

    await this.hourlyRateInput.fill(String(data.step5.hourlyRate));
    await expect(this.workPeriodInput).toBeVisible();
    await this.workPeriodInput.click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateTitle = this.formatDateISO(tomorrow);

    await this.page.locator(`.ant-picker-dropdown td[title="${dateTitle}"]`).first().click();
    await this.page.locator(`.ant-picker-dropdown td[title="${dateTitle}"]`).first().click();
    await this.page.keyboard.press('Escape');

    await this.setTimeValue(this.shiftStartInput, data.step5.shiftStart);
    await this.setTimeValue(this.shiftEndInput, data.step5.shiftEnd);
    await this.employeesCountInput.fill(String(data.step5.employeesCount));
  }

  async submitOrder(): Promise<void> {
    await this.orderButton.click();
    await expect(this.orderCreatedText).toBeVisible();
  }
}
