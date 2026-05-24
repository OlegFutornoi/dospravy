import { expect, type Locator, type Page } from '@playwright/test';
import type { TestDataFile } from '../../../src/utils/data/load-test-data';

export type OrderCreateData = NonNullable<TestDataFile['order']>['create'];

export interface CreatedBusinessOrderSnapshot {
  businessOrderNumber: string;
  businessDraftOrderId: string;
  successMessage: string;
}

export class BusinessOrderWizardPage {
  constructor(private readonly page: Page) {}

  private getLogContext(): string {
    const currentUrl = this.page.url();
    const pathMatch = currentUrl.match(/^https?:\/\/[^/]+(\/[^?#]*)/);
    const pathname = pathMatch?.[1] ?? currentUrl;
    const orderMatch = pathname.match(/\/order\/([^/?#]+)/);
    if (orderMatch) {
      return `orderId: ${orderMatch[1]}`;
    }

    const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    return `path: ${normalizedPath}`;
  }

  private log(message: string): void {
    console.log(`[E2E] ${message} | ${this.getLogContext()}`);
  }

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
    const fromFormItem = this.page
      .locator('.ant-form-item')
      .filter({ has: this.page.locator('label').filter({ hasText: 'Назва позиції' }) })
      .first()
      .locator('input.ant-select-selection-search-input')
      .first();

    const fromLabel = this.page
      .getByLabel('Назва позиції')
      .locator('xpath=ancestor::*[contains(@class,"ant-select")]')
      .first()
      .locator('input.ant-select-selection-search-input')
      .first();

    return fromFormItem.or(fromLabel).first();
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
    return this.page
      .getByText('Ключові вимоги')
      .locator(
        'xpath=ancestor::*[.//*[normalize-space()="Свій варіант" or normalize-space()="Свiй варiант"]][1]',
      );
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
    return this.page.locator('div.ant-select:has(#coast) .ant-select-selector').first();
  }

  private get metroSelect() {
    return this.page.getByLabel('Найближче метро');
  }

  private get districtInput() {
    return this.page.getByLabel('Район');
  }

  private get landmarksInput() {
    const fromFormItem = this.page
      .locator('.ant-form-item')
      .filter({ hasText: 'Орієнтири' })
      .first()
      .locator('input, textarea')
      .first();

    return fromFormItem.or(this.page.getByLabel(/Орієнтири/)).first();
  }

  private get howToGetThereInput() {
    const fromFormItem = this.page
      .locator('.ant-form-item')
      .filter({ hasText: 'Як дістатись' })
      .first()
      .locator('textarea, input')
      .first();

    return fromFormItem.or(this.page.getByLabel(/Як дістатись/)).first();
  }

  private get hourlyRateInput() {
    return this.page.getByLabel('Оплата (грн/год)');
  }

  private get workPeriodInput() {
    const fromFormItem = this.page
      .locator('.ant-form-item')
      .filter({ hasText: 'Період роботи' })
      .first()
      .locator('.ant-picker')
      .first();

    return fromFormItem.or(this.page.getByLabel('Період роботи')).first();
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
    this.log('Відкрито майстер створення замовлення');
  }

  async waitForCompanyInfoLoaded(): Promise<void> {
    await expect(this.companyNameInput).toBeVisible();
    await expect(this.companyNameInput).toHaveValue(/.+/);
    await expect(this.companyShortDescriptionInput).toBeVisible();
    await expect(this.companyShortDescriptionInput).toHaveValue(/.+/);
    this.log('Крок 1: Інформація про компанію заповнена');
  }

  async goNext(): Promise<void> {
    await expect(this.nextStepButton).toBeEnabled();
    await this.nextStepButton.click();
    this.log('Натиснуто "Наступний крок"');
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
        const optionByText = group.getByText(candidate, { exact: true }).first();
        try {
          await expect(optionByText).toBeVisible();
          await optionByText.click();
          return;
        } catch {
          void 0;
        }
      }
    }

    const option = group.locator('label').filter({ hasText: label }).first();
    try {
      await expect(option).toBeVisible();
      await option.click();
      const input = option.locator('input[type="checkbox"]');
      if ((await input.count()) > 0) {
        await expect(input).toBeChecked();
      }
    } catch {
      const optionByText = group.getByText(label, { exact: true }).first();
      await expect(optionByText).toBeVisible();
      await optionByText.click();
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

  private async clickTagButton(label: string): Promise<void> {
    const root = this.page.locator('main');

    const escapeRegex = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const foldChar = (ch: string) => {
      switch (ch) {
        case 'і':
        case 'i':
          return '[іi]';
        case 'І':
        case 'I':
          return '[ІI]';
        case 'а':
        case 'a':
          return '[аa]';
        case 'А':
        case 'A':
          return '[АA]';
        case 'с':
        case 'c':
          return '[сc]';
        case 'С':
        case 'C':
          return '[СC]';
        case 'е':
        case 'e':
          return '[еe]';
        case 'Е':
        case 'E':
          return '[ЕE]';
        case 'о':
        case 'o':
          return '[оo]';
        case 'О':
        case 'O':
          return '[ОO]';
        case 'р':
        case 'p':
          return '[рp]';
        case 'Р':
        case 'P':
          return '[РP]';
        case 'х':
        case 'x':
          return '[хx]';
        case 'Х':
        case 'X':
          return '[ХX]';
        case 'у':
        case 'y':
          return '[уy]';
        case 'У':
        case 'Y':
          return '[УY]';
        case 'к':
        case 'k':
          return '[кk]';
        case 'К':
        case 'K':
          return '[КK]';
        case 'м':
        case 'm':
          return '[мm]';
        case 'М':
        case 'M':
          return '[МM]';
        case 'н':
        case 'h':
          return '[нh]';
        case 'Н':
        case 'H':
          return '[НH]';
        case 'в':
        case 'b':
          return '[вb]';
        case 'В':
        case 'B':
          return '[ВB]';
        case 'т':
        case 't':
          return '[тt]';
        case 'Т':
        case 'T':
          return '[ТT]';
        default:
          return escapeRegex(ch);
      }
    };
    const pattern = Array.from(label)
      .map((ch) => {
        if (/\s/.test(ch)) return '\\s+';
        return foldChar(ch);
      })
      .join('');

    const option = root.getByText(new RegExp(`^${pattern}$`)).first();
    await expect(option).toBeVisible();
    await option.click();
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
    await input.click();
    await input.press('Control+A');
    await input.press('Backspace');
    await input.type(value, { delay: 80 });
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
  }

  private async expectAutocompleteHasValue(input: Locator, value: string): Promise<void> {
    const selectRoot = input.locator('xpath=ancestor::*[contains(@class,"ant-select")]').first();
    if ((await selectRoot.count()) > 0) {
      const selectionItem = selectRoot.locator('.ant-select-selection-item');
      if ((await selectionItem.count()) > 0) {
        await expect(selectionItem).toHaveText(value);
        return;
      }
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

  private getBusinessDraftOrderId(): string {
    const match = this.page.url().match(/\/order\/([^/?#]+)/);
    if (!match?.[1]) {
      throw new Error('Не вдалося визначити draft orderId з URL business order wizard');
    }

    return match[1];
  }

  async fillStep2OrderInfo(data: OrderCreateData): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: 'Інформація про замовлення' }),
    ).toBeVisible();
    this.log('Крок 2: Інформація про замовлення');

    const positionName = data.step2.positionName.trim();
    const parts = positionName.split(/\s+/).filter(Boolean);
    const firstWord = parts[0] ?? positionName;
    const queryBase = firstWord.toLowerCase();

    await this.positionNameInput.click();
    await this.positionNameInput.press('Control+A');
    await this.positionNameInput.press('Backspace');
    await this.positionNameInput.pressSequentially(queryBase, { delay: 1000 });
    this.log(`Крок 2: Введено назву позиції "${queryBase}"`);

    const addNewRow = this.page.getByText(/Додати нову позицію/).first();
    await expect(addNewRow).toBeVisible({ timeout: 10_000 });

    const option = this.page
      .locator('[role="option"]:visible')
      .filter({ hasText: new RegExp(`^${positionName}$`) })
      .first();

    try {
      await expect(option).toBeVisible({ timeout: 5_000 });
      await option.click();
    } catch {
      await this.positionNameInput.pressSequentially(' р', { delay: 1000 });
      try {
        const refinedOption = this.page.getByText(positionName, { exact: true }).last();
        await expect(refinedOption).toBeVisible({ timeout: 10_000 });
        await refinedOption.click();
      } catch {
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
      }
    }
    await this.expectAutocompleteHasValue(this.positionNameInput, positionName);
    this.log(`Крок 2: Обрано позицію "${positionName}"`);

    await this.workToDoInput.fill(data.step2.workDescription);
    this.log(`Крок 2: Заповнено "Що потрібно робити" = "${data.step2.workDescription}"`);

    for (const perk of data.step2.perks) {
      await this.selectCheckboxInGroup(this.perksGroup, perk);
    }
    this.log(`Крок 2: Обрано переваги = ${data.step2.perks.join(', ')}`);

    await this.selectRadioInGroup(this.genderGroup, data.step2.gender);
    this.log(`Крок 2: Обрано стать = "${data.step2.gender}"`);

    await expect(this.ageFromInput).toBeVisible();
    await this.ageFromInput.fill(String(data.step2.ageFrom));
    await this.ageToInput.fill(String(data.step2.ageTo));
    this.log(`Крок 2: Вік = ${data.step2.ageFrom}-${data.step2.ageTo}`);

    for (const category of data.step2.candidateCategories) {
      await this.selectCheckboxInGroup(this.candidateCategoriesGroup, category);
    }
    this.log(`Крок 2: Категорії кандидатів = ${data.step2.candidateCategories.join(', ')}`);
    this.log('Крок 2: Поля заповнено');
  }

  async fillStep3Requirements(data: OrderCreateData): Promise<void> {
    await expect(
      this.page.getByRole('heading', { name: 'Вимоги до працівника та досвід' }),
    ).toBeVisible({ timeout: 30_000 });
    this.log('Крок 3: Вимоги до працівника та досвід');

    for (const req of data.step3.keyRequirements) {
      await this.clickTagButton(req);
    }
    this.log(`Крок 3: Ключові вимоги = ${data.step3.keyRequirements.join(', ')}`);

    await this.thingsToBringInput.fill(data.step3.thingsToBring);
    this.log(`Крок 3: "Що з собою мати" = "${data.step3.thingsToBring}"`);

    for (const doc of data.step3.requiredDocuments) {
      await this.clickTagButton(doc);
    }
    this.log(`Крок 3: Документи = ${data.step3.requiredDocuments.join(', ')}`);

    if (data.step3.otherDocuments.length > 0 && (await this.otherDocumentsSelect.count()) > 0) {
      await this.otherDocumentsSelect.click();
      for (const item of data.step3.otherDocuments) {
        await this.page.getByRole('option', { name: item }).click();
      }
      await this.page.keyboard.press('Escape');
    }

    await this.selectRadioInGroup(this.experienceGroup, data.step3.experience);
    this.log(`Крок 3: Досвід = "${data.step3.experience}"`);
    this.log('Крок 3: Поля заповнено');
  }

  async fillStep4WorkPlace(data: OrderCreateData): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Місце роботи' })).toBeVisible();
    this.log('Крок 4: Місце роботи');

    await this.selectFirstAutocompleteOption(this.cityInput, data.step4.city);
    await this.selectFirstAutocompleteOption(this.streetInput, data.step4.street);
    await this.buildingNumberInput.fill(data.step4.buildingNumber);
    this.log(
      `Крок 4: Адреса = ${data.step4.city}, ${data.step4.street}, ${data.step4.buildingNumber}`,
    );

    const coastInput = this.page.locator('#coast');
    if ((await coastInput.count()) > 0) {
      try {
        await expect(coastInput).toBeEnabled({ timeout: 1_000 });
        await this.riverBankSelect.click();
        const listId = await coastInput.getAttribute('aria-controls');
        const coastList = listId
          ? this.page.locator(`#${listId}`)
          : this.page.locator('#coast_list');
        await expect(coastList).toBeVisible({ timeout: 5_000 });
        await coastList.getByText(data.step4.riverBank).first().click();
      } catch {
        void 0;
      }
    }

    const subwayInput = this.page.locator('#subway');
    if ((await subwayInput.count()) > 0) {
      try {
        await expect(subwayInput).toBeEnabled({ timeout: 1_000 });
        await this.selectFromSelectByTyping(subwayInput, data.step4.metro);
      } catch {
        void 0;
      }
    }

    await this.districtInput.fill(data.step4.district);
    await this.landmarksInput.fill(data.step4.landmarks);
    await this.howToGetThereInput.fill(data.step4.howToGetThere);
    this.log(`Крок 4: Район = "${data.step4.district}"`);
    this.log(`Крок 4: Орієнтири = "${data.step4.landmarks}"`);
    this.log(`Крок 4: Як дістатись = "${data.step4.howToGetThere}"`);
    this.log('Крок 4: Поля заповнено');
  }

  async fillStep5Schedule(data: OrderCreateData): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Графік та години роботи' })).toBeVisible();
    this.log('Крок 5: Графік та години роботи');

    await this.hourlyRateInput.fill(String(data.step5.hourlyRate));
    this.log(`Крок 5: Оплата = ${data.step5.hourlyRate} грн/год`);
    await expect(this.workPeriodInput).toBeVisible();
    await this.workPeriodInput.click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateTitle = this.formatDateISO(tomorrow);

    const pickerDropdown = this.page.locator('.ant-picker-dropdown').last();
    await expect(pickerDropdown).toBeVisible();

    const dateCell = pickerDropdown.locator(`td[title="${dateTitle}"]`).first();
    await dateCell.click();
    await dateCell.click();

    const applyButton = pickerDropdown.getByRole('button', { name: 'Застосувати' }).first();
    if ((await applyButton.count()) > 0) {
      await applyButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }

    await this.setTimeValue(this.shiftStartInput, data.step5.shiftStart);
    await this.setTimeValue(this.shiftEndInput, data.step5.shiftEnd);
    await this.employeesCountInput.fill(String(data.step5.employeesCount));
    this.log(
      `Крок 5: Зміна = ${data.step5.shiftStart}-${data.step5.shiftEnd}, працівників = ${data.step5.employeesCount}`,
    );
    this.log('Крок 5: Поля заповнено');
  }

  async submitOrderAndCapture(): Promise<CreatedBusinessOrderSnapshot> {
    const businessDraftOrderId = this.getBusinessDraftOrderId();
    await this.orderButton.click();
    this.log('Натиснуто "Замовити"');
    await expect(this.orderCreatedText).toBeVisible({ timeout: 30_000 });
    const successMessage = (await this.orderCreatedText.first().innerText()).trim();
    const orderNumberMatch = successMessage.match(/Замовлення №\s*([\d-]+)/);
    const businessOrderNumber = orderNumberMatch?.[1]?.trim();

    if (!businessOrderNumber) {
      throw new Error(
        `Не вдалося визначити номер створеного замовлення з тексту "${successMessage}"`,
      );
    }

    this.log(
      `Замовлення створено: номер="${businessOrderNumber}", draftOrderId="${businessDraftOrderId}"`,
    );

    return {
      businessOrderNumber,
      businessDraftOrderId,
      successMessage,
    };
  }

  async submitOrder(): Promise<void> {
    await this.submitOrderAndCapture();
  }
}
