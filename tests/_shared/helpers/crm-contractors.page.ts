import { expect, type Locator, type Page, type Response } from '@playwright/test';
import type { GeneratedCrmContractorData } from '../factories/crm-contractor.factory';

export class CrmContractorsPage {
  constructor(private readonly page: Page) {}

  private readonly requestTimeoutMs = 30_000;

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

  logStep(stepMessage: string): void {
    this.log(`Крок: ${stepMessage}`);
  }

  get contractorsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Кандидати' });
  }

  get contractorProfileHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Профіль кандидата' });
  }

  get contractorsMenuItem(): Locator {
    return this.page.locator('aside [role="menuitem"][title="Кандидати"]');
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

  get contractorRows(): Locator {
    return this.page
      .locator('tbody tr')
      .filter({ has: this.page.locator('td:last-child button.btn.btn-secondary.btn--sm') });
  }

  get detailsButtons(): Locator {
    return this.page.locator('tbody tr td:last-child button.btn.btn-secondary.btn--sm');
  }

  get commentPillButtons(): Locator {
    return this.page.locator('tbody tr td button.contractors-list-comment-cell__pill');
  }

  get viewAllCommentsButton(): Locator {
    return this.page.locator('button.contractors-list-comment-popover__link');
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

  get agentCommentsTab(): Locator {
    return this.page.getByRole('tab', { name: 'Комент. агентів' });
  }

  get addAgentCommentButton(): Locator {
    return this.page.getByRole('button', { name: 'Додати коментар' }).first();
  }

  get agentCommentModal(): Locator {
    return this.page.locator('.ant-modal.contractor-create');
  }

  get agentCommentTextarea(): Locator {
    return this.agentCommentModal.locator('textarea[placeholder="Введіть коментар..."]');
  }

  get addAgentCommentSubmitButton(): Locator {
    return this.agentCommentModal.getByRole('button', { name: 'Додати' });
  }

  get agentsCommentsSectionTitle(): Locator {
    return this.page.getByText('Коментарі агентів', { exact: true }).first();
  }

  private async waitForApiResponse(matcher: string | RegExp, method = 'GET'): Promise<Response> {
    return this.page.waitForResponse(
      (response) => {
        const url = response.url();
        const matches = typeof matcher === 'string' ? url.includes(matcher) : matcher.test(url);

        return (
          matches &&
          response.request().method() === method &&
          response.status() >= 200 &&
          response.status() < 400
        );
      },
      { timeout: this.requestTimeoutMs },
    );
  }

  private createResponseWaiter(
    name: string,
    matcher: string | RegExp,
    method = 'GET',
  ): {
    name: string;
    promise: Promise<Response>;
  } {
    return {
      name,
      promise: this.waitForApiResponse(matcher, method),
    };
  }

  private async waitForResponseGroup(
    label: string,
    waiters: Array<{
      name: string;
      promise: Promise<Response>;
    }>,
  ): Promise<Response[]> {
    const responses = await Promise.all(waiters.map((waiter) => waiter.promise));
    const printable = responses
      .map((response, index) => `${waiters[index]!.name}=${response.status()}`)
      .join(', ');

    this.log(`${label}: ${printable}`);
    return responses;
  }

  private createContractorsLoadWaiters() {
    return [
      this.createResponseWaiter('contractors-cities', '/users/crm/contractors/cities/'),
      this.createResponseWaiter('contractors-agents', '/users/crm/contractors/agents/'),
      this.createResponseWaiter(
        'contractors-list',
        /\/users\/crm\/contractors\/\?(?:.*limit=\d+.*|.*offset=\d+.*|.*last_action_type=.*)/,
      ),
    ];
  }

  private createContractorProfileLoadWaiters() {
    return [
      this.createResponseWaiter('contractor-profile', /\/users\/crm\/contractors\/[^/]+\/$/),
      this.createResponseWaiter(
        'contractor-documents',
        /\/dubidoc\/contractors\/[^/]+\/documents\/$/,
      ),
    ];
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

  async goto(entryUrl = '/contractors'): Promise<void> {
    const loadWaiters = this.createContractorsLoadWaiters();
    await this.page.goto(entryUrl);
    await this.waitForResponseGroup('Дочекався ключових запитів contractors', loadWaiters);
    await this.expectLoaded();
    this.log('Відкрито CRM сторінку кандидатів');
  }

  async openFromSidebar(): Promise<void> {
    this.logStep('Відкриваю розділ "Кандидати" через sidebar');
    const loadWaiters = this.createContractorsLoadWaiters();
    await expect(this.contractorsMenuItem).toBeVisible({ timeout: 15_000 });
    await this.contractorsMenuItem.click();
    await expect(this.page).toHaveURL(/\/contractors\/?(\?.*)?$/);
    await this.waitForResponseGroup('Дочекався ключових запитів contractors', loadWaiters);
    await this.expectLoaded();
    this.log('Відкрито CRM сторінку кандидатів через sidebar');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.contractorsHeading).toBeVisible({ timeout: 15_000 });
    await expect(this.activeMenuItem).toHaveAttribute('title', 'Кандидати');
    await expect(this.newContractorButton).toBeVisible({ timeout: 15_000 });
    await expect(this.searchInput).toBeVisible({ timeout: 15_000 });
    const contractorsCount = await this.getContractorsCount();
    this.log(`Сторінка contractors завантажена, кандидатів у списку: ${contractorsCount}`);
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

  async getContractorsCount(): Promise<number> {
    return this.detailsButtons.count();
  }

  async currentContractorRowSummaries(limit = 5): Promise<string[]> {
    return this.contractorRows.evaluateAll(
      (rows, maxItems) =>
        rows
          .map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '')
          .filter(Boolean)
          .slice(0, maxItems as number),
      limit,
    );
  }

  async logCurrentContractorsList(prefix: string): Promise<void> {
    const contractors = await this.currentContractorRowSummaries();
    const printable = contractors.length > 0 ? contractors.join(' || ') : 'список порожній';
    this.log(`${prefix}: ${printable}`);
  }

  async openFirstContractorDetails(): Promise<string> {
    this.logStep('Вибираю першого кандидата і відкриваю його деталі');
    const firstRow = this.contractorRows.first();
    const firstDetailsButton = this.detailsButtons.first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });
    await expect(firstDetailsButton).toBeVisible({ timeout: 15_000 });

    const selectedContractorSummary = this.normalizeText(await firstRow.textContent());
    const loadWaiters = this.createContractorProfileLoadWaiters();
    await firstDetailsButton.click();
    await expect(this.page).toHaveURL(/\/contractors\/contractor\/[^/?#]+(?:\?.*)?$/);
    await this.waitForResponseGroup('Дочекався ключових запитів профілю кандидата', loadWaiters);
    await expect(this.contractorProfileHeading).toBeVisible({ timeout: 15_000 });
    this.log(`Відкрито профіль першого кандидата: ${selectedContractorSummary}`);

    return selectedContractorSummary;
  }

  private async waitForContractorProfileOpened(
    label: string,
    loadWaiters = this.createContractorProfileLoadWaiters(),
  ): Promise<void> {
    await expect(this.page).toHaveURL(/\/contractors\/contractor\/[^/?#]+(?:\?.*)?$/, {
      timeout: 15_000,
    });
    await this.waitForResponseGroup(label, loadWaiters);
    await expect(this.contractorProfileHeading).toBeVisible({ timeout: 15_000 });
  }

  async openFirstContractorAgentCommentsFromCommentColumn(): Promise<{
    contractorSummary: string;
    entryPath: 'existing_comment' | 'empty_comment';
  }> {
    this.logStep('Відкриваю першого кандидата через колонку "Коментар"');
    const firstRow = this.contractorRows.first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    const contractorSummary = this.normalizeText(await firstRow.textContent());
    const commentCell = firstRow.locator('td').nth(6);
    const commentPillButton = commentCell.locator('button.contractors-list-comment-cell__pill');
    const hasCommentPill = await commentPillButton.count();

    if (hasCommentPill > 0) {
      this.logStep('У першого кандидата вже є коментар, відкриваю попап коментаря');
      const loadWaiters = this.createContractorProfileLoadWaiters();
      await expect(commentPillButton).toBeVisible({ timeout: 15_000 });
      await commentPillButton.hover();
      await expect(this.viewAllCommentsButton).toBeVisible({ timeout: 15_000 });
      this.logStep('У попапі натискаю "Переглянути усі коментарі"');
      await this.viewAllCommentsButton.click();
      const navigatedThroughPopover = await this.page
        .waitForURL(/\/contractors\/contractor\/[^/?#]+(?:\?.*)?$/, { timeout: 4_000 })
        .then(() => true)
        .catch(() => false);

      if (!navigatedThroughPopover) {
        this.log(
          'Після кліку по "Переглянути усі коментарі" навігація не відбулась, повторюю перехід прямим кліком по комірці коментаря',
        );
        await commentCell.click();
      }

      const navigatedThroughCommentCell = await this.page
        .waitForURL(/\/contractors\/contractor\/[^/?#]+(?:\?.*)?$/, { timeout: 4_000 })
        .then(() => true)
        .catch(() => false);

      if (!navigatedThroughPopover && !navigatedThroughCommentCell) {
        this.log(
          'Прямий клік по комірці коментаря теж не відкрив профіль, використовую fallback через кнопку "Деталі" цього ж кандидата',
        );
        const detailsButton = firstRow.locator('td:last-child button.btn.btn-secondary.btn--sm');
        await expect(detailsButton).toBeVisible({ timeout: 15_000 });
        await detailsButton.click();
      }

      await this.waitForContractorProfileOpened(
        'Дочекався ключових запитів профілю кандидата після переходу з коментаря',
        loadWaiters,
      );
      this.log(`Відкрито профіль кандидата через попап існуючого коментаря: ${contractorSummary}`);

      return {
        contractorSummary,
        entryPath: 'existing_comment',
      };
    }

    this.logStep('У першого кандидата немає коментаря, клікаю по порожній комірці коментаря');
    await expect(commentCell).toBeVisible({ timeout: 15_000 });
    await commentCell.click();
    await this.waitForContractorProfileOpened(
      'Дочекався ключових запитів профілю кандидата після кліку по порожньому коментарю',
    );
    this.log(`Відкрито профіль кандидата через порожню комірку коментаря: ${contractorSummary}`);

    return {
      contractorSummary,
      entryPath: 'empty_comment',
    };
  }

  async openAgentCommentsTab(): Promise<void> {
    this.logStep('Переходжу на вкладку "Комент. агентів"');
    const notesResponse = this.waitForApiResponse(
      /\/users\/crm\/contractors\/[^/]+\/notes\/$/,
    ).catch(() => null);
    await expect(this.agentCommentsTab).toBeVisible({ timeout: 15_000 });
    await this.agentCommentsTab.click();
    await Promise.race([
      notesResponse,
      this.addAgentCommentButton.waitFor({ state: 'visible', timeout: 15_000 }),
    ]);
    await expect(this.addAgentCommentButton).toBeVisible({ timeout: 15_000 });
    await expect(this.agentsCommentsSectionTitle).toBeVisible({ timeout: 15_000 });
    this.log('Відкрито вкладку "Комент. агентів"');
  }

  async addAgentComment(commentText: string): Promise<void> {
    this.logStep('Відкриваю модальне вікно додавання коментаря агента');
    await expect(this.addAgentCommentButton).toBeVisible({ timeout: 15_000 });
    await this.addAgentCommentButton.click();
    await expect(this.agentCommentModal).toBeVisible({ timeout: 15_000 });
    await expect(this.agentCommentTextarea).toBeVisible({ timeout: 15_000 });
    this.logStep(`Вводжу текст нового коментаря довжиною ${commentText.length} символів`);
    await this.agentCommentTextarea.fill(commentText);

    const saveCommentResponse = this.waitForApiResponse(
      /\/users\/crm\/contractors\/[^/]+\/notes\/$/,
      'POST',
    );
    this.logStep('Зберігаю новий коментар агента');
    await expect(this.addAgentCommentSubmitButton).toBeEnabled({ timeout: 15_000 });
    await this.addAgentCommentSubmitButton.click();
    await saveCommentResponse;
    this.logStep("Перевіряю, що новий коментар з'явився у списку");
    await expect(this.page.getByText(commentText, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    this.log(`Додано новий коментар агента: "${commentText}"`);
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
