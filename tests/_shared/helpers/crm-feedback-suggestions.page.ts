import { expect, type Locator, type Page, type Response } from '@playwright/test';

export interface CrmFeedbackSuggestionCardDetails {
  fullText: string;
  name: string;
  phone: string;
  city: string;
  specialization: string;
  actionButtons: string[];
}

export interface CrmFeedbackSuggestionsLoadResult {
  activeOrdersCount: number | null;
  closedOrdersCount: number | null;
  applyRequestsCount: number | null;
}

export class CrmFeedbackSuggestionsPage {
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

  private async extractItemsCount(response: Response): Promise<number | null> {
    try {
      const data: unknown = await response.json();
      return this.findItemsCount(data);
    } catch {
      return null;
    }
  }

  private findItemsCount(payload: unknown): number | null {
    if (Array.isArray(payload)) {
      return payload.length;
    }

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const record = payload as Record<string, unknown>;
    const arrayKeys = ['results', 'items', 'data', 'rows', 'list'];

    for (const key of arrayKeys) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value.length;
      }
    }

    const numericKeys = ['count', 'total', 'totalCount'];
    for (const key of numericKeys) {
      const value = record[key];
      if (typeof value === 'number') {
        return value;
      }
    }

    return null;
  }

  private createActiveOrdersLoadWaiters() {
    return [
      this.createResponseWaiter('order-active', '/order/?is_open=true&status=active'),
      this.createResponseWaiter(
        'order-closed',
        '/order/?is_open=false&status=active&status=paused',
      ),
      this.createResponseWaiter('apply-requests', '/apply-requests/'),
    ];
  }

  menuItem(title: 'Відгуки і пропозиції'): Locator {
    return this.page.locator(`aside [role="menuitem"][title="${title}"]`);
  }

  get activeMenuItem(): Locator {
    return this.page.locator('aside [role="menuitem"].ant-menu-item-selected');
  }

  get workspace(): Locator {
    return this.page.locator('.page-block.rounded.wrapper');
  }

  get sidebar(): Locator {
    return this.page.locator('.page-sidebar');
  }

  get suggestionsSearchInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Ім’я / Телефон' });
  }

  get suggestionCards(): Locator {
    return this.sidebar.locator(':scope > div').nth(1).locator(':scope > div');
  }

  get activeSuggestionCard(): Locator {
    return this.suggestionCards.filter({ has: this.page.locator('button.btn') }).first();
  }

  suggestionCardByIndex(index: number): Locator {
    return this.suggestionCards.nth(index);
  }

  get detailsPanel(): Locator {
    return this.page.locator('.page-body');
  }

  get loadingSpinners(): Locator {
    return this.page.locator('.ant-spin-spinning');
  }

  async visibleLoadingSpinnersCount(): Promise<number> {
    return this.loadingSpinners.evaluateAll(
      (nodes) =>
        nodes.filter((node) => {
          const htmlNode = node as typeof node & { offsetParent: object | null };
          const style = globalThis.getComputedStyle(node);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            htmlNode.offsetParent !== null
          );
        }).length,
    );
  }

  get decisionButtons(): Locator {
    return this.activeSuggestionCard.locator('button.btn');
  }

  get rejectReasonCombobox(): Locator {
    return this.activeSuggestionCard.locator('[role="combobox"]').first();
  }

  get rejectReasonSaveButton(): Locator {
    return this.activeSuggestionCard.getByRole('button', { name: 'Зберегти' }).first();
  }

  decisionButtonsForCard(card: Locator): Locator {
    return card.locator('button.btn');
  }

  async openFromSidebar(): Promise<CrmFeedbackSuggestionsLoadResult> {
    const loadWaiters = this.createActiveOrdersLoadWaiters();
    await expect(this.menuItem('Відгуки і пропозиції')).toBeVisible({ timeout: 15_000 });
    await this.menuItem('Відгуки і пропозиції').click();
    await expect(this.page).toHaveURL(/\/activeOrders\/?(\?.*)?$/);
    const responses = await this.waitForResponseGroup(
      'Дочекався ключових запитів activeOrders',
      loadWaiters,
    );
    await this.expectLoaded();
    this.log('Відкрито розділ "Відгуки і пропозиції" через sidebar');

    const [activeOrdersResponse, closedOrdersResponse, applyRequestsResponse] = responses;
    return {
      activeOrdersCount: activeOrdersResponse
        ? await this.extractItemsCount(activeOrdersResponse)
        : null,
      closedOrdersCount: closedOrdersResponse
        ? await this.extractItemsCount(closedOrdersResponse)
        : null,
      applyRequestsCount: applyRequestsResponse
        ? await this.extractItemsCount(applyRequestsResponse)
        : null,
    };
  }

  async expectLoaded(): Promise<void> {
    await expect(this.activeMenuItem).toHaveAttribute('title', 'Відгуки і пропозиції', {
      timeout: 30_000,
    });
    await expect(this.workspace).toBeVisible({ timeout: 30_000 });
    await expect(this.sidebar).toBeVisible({ timeout: 30_000 });
    await expect(this.suggestionsSearchInput).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(() => this.visibleLoadingSpinnersCount(), {
        timeout: 30_000,
        message: 'Після відкриття activeOrders видимі спінери повинні зникнути',
      })
      .toBe(0);

    const suggestionsCount = await this.suggestionCards.count();
    this.log(`Сторінка activeOrders завантажена, пропозицій у списку: ${suggestionsCount}`);
  }

  async getSuggestionsCount(): Promise<number> {
    return this.suggestionCards.count();
  }

  async expectSuggestionsCountAtLeast(minCount: number): Promise<number> {
    await expect
      .poll(() => this.getSuggestionsCount(), {
        timeout: 30_000,
        message: `Після повного завантаження сторінки має бути щонайменше ${minCount} карток`,
      })
      .toBeGreaterThanOrEqual(minCount);

    const count = await this.getSuggestionsCount();
    this.log(`Після повного завантаження у списку є ${count} карток`);
    return count;
  }

  async expectSuggestionsCount(expectedCount: number): Promise<void> {
    await expect
      .poll(() => this.getSuggestionsCount(), {
        timeout: 30_000,
        message: `Після дії у списку має залишитись ${expectedCount} карток`,
      })
      .toBe(expectedCount);

    this.log(`Після дії у списку підтверджено ${expectedCount} карток`);
  }

  async suggestionCardSignatures(): Promise<string[]> {
    return this.suggestionCards.evaluateAll((cards) =>
      cards.map((card) => card.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
    );
  }

  async currentSuggestionSummaries(limit = 5): Promise<string[]> {
    const signatures = await this.suggestionCardSignatures();
    return signatures.slice(0, limit);
  }

  async logCurrentSuggestionsList(prefix: string): Promise<void> {
    const suggestions = await this.currentSuggestionSummaries();
    const printable = suggestions.length > 0 ? suggestions.join(' || ') : 'список порожній';
    this.log(`${prefix}: ${printable}`);
  }

  async readSuggestionCardDetails(card: Locator): Promise<CrmFeedbackSuggestionCardDetails> {
    return card.evaluate((element) => {
      const htmlElement = element as typeof element & { innerText?: string };
      const normalize = (value: string | null | undefined) =>
        value?.replace(/\s+/g, ' ').trim() ?? '';
      const text = normalize(htmlElement.innerText || element.textContent);
      const lines = (htmlElement.innerText || '')
        .split('\n')
        .map((line: string) => normalize(line))
        .filter(Boolean);

      const phone =
        lines.find((line: string) => /\+?\d[\d\s()+-]{8,}/.test(line)) ??
        text.match(/\+?\d[\d\s()+-]{8,}/)?.[0] ??
        '';
      const name = lines[0] ?? '';
      const city =
        lines.find(
          (line: string) =>
            line !== name &&
            !line.includes(phone) &&
            !/^\d{2}\.\d{2}\.\d{2}/.test(line) &&
            !/(чол\.|нев\.|жін\.)/i.test(line) &&
            /[А-ЯІЇЄA-Z]/.test(line),
        ) ?? '';
      const specialization =
        [...lines].reverse().find((line: string) => {
          return (
            line !== city &&
            line !== phone &&
            !/^\d{2}\.\d{2}\.\d{2}/.test(line) &&
            !/(підтвердити|відмов)/i.test(line)
          );
        }) ?? '';

      return {
        fullText: text,
        name,
        phone,
        city,
        specialization,
        actionButtons: Array.from(element.querySelectorAll('button'))
          .map((button) => normalize(button.textContent))
          .filter(Boolean),
      };
    });
  }

  async openSuggestionByIndex(index: number): Promise<void> {
    const targetCard = this.suggestionCardByIndex(index);
    await expect(targetCard).toBeVisible({ timeout: 15_000 });

    const cardDetails = await this.readSuggestionCardDetails(targetCard);
    await targetCard.scrollIntoViewIfNeeded();
    const cardDecisionButtons = this.decisionButtonsForCard(targetCard);
    if ((await cardDecisionButtons.count()) === 0) {
      await targetCard.click();
    }

    await expect(this.detailsPanel).toBeVisible({ timeout: 15_000 });
    await expect(cardDecisionButtons.nth(0)).toBeVisible({ timeout: 15_000 });
    this.log(
      `Відкрито пропозицію #${index + 1}: name="${cardDetails.name}", phone="${cardDetails.phone}", city="${cardDetails.city}", specialization="${cardDetails.specialization}", buttons="${cardDetails.actionButtons.join(
        ' | ',
      )}", fullText="${cardDetails.fullText}"`,
    );
  }

  async currentActiveSuggestionSignature(): Promise<string> {
    await expect(this.activeSuggestionCard).toBeVisible({ timeout: 15_000 });
    const signature = this.normalizeText(await this.activeSuggestionCard.textContent());

    if (!signature) {
      throw new Error('Не вдалося зчитати текст активної пропозиції на зміну');
    }

    return signature;
  }

  async performActiveSuggestionDecision(
    actionIndex: number,
    actionDescription: string,
  ): Promise<void> {
    const actionButton = this.decisionButtons.nth(actionIndex);
    const activeCardDetails = await this.readSuggestionCardDetails(this.activeSuggestionCard);
    const actionButtons = await this.decisionButtons.allTextContents();
    const normalizedButtons = actionButtons.map((text) => this.normalizeText(text)).filter(Boolean);

    await expect(actionButton).toBeVisible({ timeout: 15_000 });
    await expect(actionButton).toBeEnabled({ timeout: 15_000 });
    await actionButton.click();

    if (actionIndex === 1) {
      await this.completeRejectReasonFlow();
    }

    this.log(
      `Виконано дію для активної пропозиції: action="${actionDescription}", actionIndex=${actionIndex}, availableButtons="${normalizedButtons.join(
        ' | ',
      )}", selectedName="${activeCardDetails.name}", selectedPhone="${activeCardDetails.phone}", selectedCity="${activeCardDetails.city}", selectedSpecialization="${activeCardDetails.specialization}", selectedFullText="${activeCardDetails.fullText}"`,
    );
  }

  private async completeRejectReasonFlow(): Promise<void> {
    const combobox = this.rejectReasonCombobox;
    await expect(combobox).toBeVisible({ timeout: 15_000 });
    await combobox.click();

    const dropdownOptions = this.page
      .locator('.ant-select-dropdown .ant-select-item-option')
      .filter({ hasNot: this.page.locator('.ant-select-item-option-disabled') });
    const firstOption = dropdownOptions.first();
    await expect(firstOption).toBeVisible({ timeout: 15_000 });
    const selectedReason = this.normalizeText(await firstOption.textContent());
    await firstOption.click();

    await expect(this.rejectReasonSaveButton).toBeEnabled({ timeout: 15_000 });
    await this.rejectReasonSaveButton.click();
    this.log(`Для відмови обрано причину "${selectedReason}" і натиснуто "Зберегти"`);
  }

  async expectSuggestionMissingBySignature(signature: string): Promise<void> {
    await expect
      .poll(
        async () => {
          const signatures = await this.suggestionCardSignatures();
          return !signatures.includes(signature);
        },
        {
          timeout: 15_000,
          message: `Після підтвердження пропозиція повинна зникнути зі списку: ${signature}`,
        },
      )
      .toBe(true);
    const suggestionsAfterAction = await this.currentSuggestionSummaries();
    const printable =
      suggestionsAfterAction.length > 0 ? suggestionsAfterAction.join(' || ') : 'список порожній';
    this.log(`Картка зникла зі списку: ${signature}. Поточний список після дії: ${printable}`);
  }

  logNoSuggestions(): void {
    this.log('Після завантаження сторінки пропозиції на зміну відсутні');
  }
}
