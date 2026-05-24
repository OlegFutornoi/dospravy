import { expect, type Locator, type Page } from '@playwright/test';

export type CrmSidebarMenuTitle =
  | 'Сейлз (створення компанії)'
  | 'Модерація замовлень'
  | 'Замовлення і підбір'
  | 'Контроль змін'
  | 'Кандидати';

export class CrmOrdersPage {
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

  get appSidebar(): Locator {
    return this.page.locator('aside.ant-layout-sider');
  }

  get pageContent(): Locator {
    return this.page.locator('main.ant-layout-content');
  }

  get ordersHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Модерація замовлень' });
  }

  get pageHeader(): Locator {
    return this.page.locator('.page-header');
  }

  get userSummary(): Locator {
    return this.page.locator('.page-header .d-flex.gap-x-2.ml-2');
  }

  menuItem(title: CrmSidebarMenuTitle): Locator {
    return this.page.locator(`aside [role="menuitem"][title="${title}"]`);
  }

  get activeMenuItem(): Locator {
    return this.page.locator('aside [role="menuitem"].ant-menu-item-selected');
  }

  get ordersWorkspace(): Locator {
    return this.page.locator('.page-block.rounded.wrapper');
  }

  get ordersSidebar(): Locator {
    return this.page.locator('.page-sidebar');
  }

  get ordersSearchInput(): Locator {
    return this.page.getByPlaceholder('Пошук...');
  }

  get ordersSidebarScroll(): Locator {
    return this.page.locator('.page-sidebar .sidebar-scroll');
  }

  get orderCards(): Locator {
    return this.page.locator('.page-sidebar .card-order');
  }

  get activeOrderCard(): Locator {
    return this.page.locator('.page-sidebar .card-order.active');
  }

  orderCardByIndex(index: number): Locator {
    return this.orderCards.nth(index);
  }

  orderCardByText(text: string): Locator {
    return this.orderCards.filter({ hasText: text }).first();
  }

  get pageBody(): Locator {
    return this.page.locator('.page-body');
  }

  get detailsForm(): Locator {
    return this.page.locator('form.form-moderate-order');
  }

  get topSummaryBlock(): Locator {
    return this.detailsForm.locator('.page-block.blue');
  }

  get detailsOrderLabel(): Locator {
    return this.detailsForm.locator('.text--xs').filter({ hasText: 'Order ' }).first();
  }

  get actionBar(): Locator {
    return this.pageBody.locator('div').filter({ has: this.copyOrderButton }).first();
  }

  get previousOrderButton(): Locator {
    return this.actionBar.locator('button.btn.btn-secondary').nth(0);
  }

  get nextOrderButton(): Locator {
    return this.actionBar.locator('button.btn.btn-secondary').nth(1);
  }

  get copyOrderButton(): Locator {
    return this.page.getByRole('button', { name: 'Копіювати замовлення' });
  }

  get publicAccessCheckbox(): Locator {
    return this.page.getByLabel('Публічний доступ');
  }

  get successSavedToast(): Locator {
    return this.page.getByText('Успішно збережено');
  }

  get moderationConfirmedToast(): Locator {
    return this.page.getByText('Замовлення успішно підтверджено');
  }

  get assignPeopleButton(): Locator {
    return this.actionBar.locator('button.btn.btn--icon.btn--tooltip');
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Зберегти' });
  }

  get confirmButton(): Locator {
    return this.page.getByRole('button', { name: 'Підтвердити' });
  }

  get categoryInput(): Locator {
    return this.page.locator('#category');
  }

  get shortDescriptionInput(): Locator {
    return this.page.locator('#short_description');
  }

  get jobResponsibilitiesInput(): Locator {
    return this.page.locator('#job_responsibilities');
  }

  get ageFromInput(): Locator {
    return this.page.locator('#age_from');
  }

  get ageToInput(): Locator {
    return this.page.locator('#age_to');
  }

  get genderSelect(): Locator {
    return this.page
      .locator('.ant-select')
      .filter({ has: this.page.locator('#gender') })
      .first();
  }

  get proposedCandidatesSelect(): Locator {
    return this.page
      .locator('.ant-select')
      .filter({ has: this.page.locator('#proposed_candidates') })
      .first();
  }

  get requiredDocumentsSelect(): Locator {
    return this.page
      .locator('.ant-tree-select')
      .filter({ has: this.page.locator('#required_documents2') })
      .first();
  }

  get locationSection(): Locator {
    return this.detailsForm
      .locator('div')
      .filter({ has: this.page.getByText('Локація') })
      .first();
  }

  get cityInput(): Locator {
    return this.page.locator('#addresses_0_city');
  }

  get coastSelect(): Locator {
    return this.page
      .locator('.ant-select')
      .filter({ has: this.page.locator('#addresses_0_coast') })
      .first();
  }

  get regionInput(): Locator {
    return this.page.locator('#addresses_0_region');
  }

  get subwaySelect(): Locator {
    return this.page
      .locator('.ant-select')
      .filter({ has: this.page.locator('#addresses_0_subway') })
      .first();
  }

  get streetInput(): Locator {
    return this.page.locator('#addresses_0_street');
  }

  get landmarksInput(): Locator {
    return this.page.locator('#addresses_0_landmarks');
  }

  get howToGetInput(): Locator {
    return this.page.locator('#addresses_0_how_to_get');
  }

  get paymentSection(): Locator {
    return this.detailsForm
      .locator('div')
      .filter({ has: this.page.getByText('Оплата') })
      .first();
  }

  get hourlyRateInput(): Locator {
    return this.page.locator('#hourly_rate');
  }

  get rateTypeSelect(): Locator {
    return this.page
      .locator('.ant-select')
      .filter({ has: this.page.locator('#rate_type') })
      .first();
  }

  get rateCommentsInput(): Locator {
    return this.page.locator('#rate_comments');
  }

  get shiftsSection(): Locator {
    return this.detailsForm
      .locator('div')
      .filter({ has: this.page.getByText('Зміни') })
      .first();
  }

  get firstShiftDateInput(): Locator {
    return this.shiftsSection.locator('input').nth(0);
  }

  get firstShiftStartTimeInput(): Locator {
    return this.shiftsSection.locator('input').nth(1);
  }

  get firstShiftEndTimeInput(): Locator {
    return this.shiftsSection.locator('input').nth(2);
  }

  get firstShiftEmployeesCountInput(): Locator {
    return this.page.locator('#shifts_0_count_employees');
  }

  get deleteShiftButton(): Locator {
    return this.shiftsSection.locator('button.btn.btn--icon.btn--error');
  }

  get addShiftButton(): Locator {
    return this.page.getByRole('button', { name: 'Додати зміну' });
  }

  get addShiftIntervalButton(): Locator {
    return this.page.getByRole('button', { name: 'Додати інтервал змін' });
  }

  get additionalInfoCollapse(): Locator {
    return this.page
      .locator('.ant-collapse')
      .filter({ has: this.page.getByText('Додаткова інформація') })
      .first();
  }

  get addR2RTagsButton(): Locator {
    return this.page.getByRole('button', { name: 'Додати теги для R2R' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/orders');
    await this.expectLoaded();
    this.log('Відкрито CRM сторінку модерації замовлень');
  }

  async gotoByUrl(url: string): Promise<void> {
    await this.page.goto(url);
    await this.expectLoaded();
    this.log('Відкрито CRM сторінку модерації замовлень за абсолютним URL');
  }

  async openFromSidebar(): Promise<void> {
    await expect(this.menuItem('Модерація замовлень')).toBeVisible();
    await this.menuItem('Модерація замовлень').click();
    await expect(this.page).toHaveURL(/\/orders\/?(\?.*)?$/);
    await this.expectLoaded();
    this.log('Відкрито розділ "Модерація замовлень" через sidebar');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.ordersHeading).toBeVisible({ timeout: 15_000 });
    await expect(this.activeMenuItem).toHaveAttribute('title', 'Модерація замовлень');
    await expect(this.ordersSearchInput).toBeVisible({ timeout: 15_000 });
    const cardsCount = await this.orderCards.count();
    this.log(`Сторінка orders завантажена, карток для модерації: ${cardsCount}`);
  }

  async getOrderCardsCount(): Promise<number> {
    return this.orderCards.count();
  }

  logNoOrdersForModeration(): void {
    this.log('Відсутні ордери для модерації');
  }

  async currentOrderId(): Promise<string> {
    await expect(this.detailsOrderLabel).toBeVisible();
    const labelText = (await this.detailsOrderLabel.textContent())?.trim() ?? '';
    const orderId = labelText.replace(/^Order\s+/, '').trim();

    if (!orderId) {
      throw new Error('Не вдалося визначити orderId у правій панелі деталей CRM orders');
    }

    return orderId;
  }

  async currentOrderLabel(): Promise<string> {
    await expect(this.detailsOrderLabel).toBeVisible();
    return this.normalizeText(await this.detailsOrderLabel.textContent());
  }

  async currentActiveCardSignature(): Promise<string> {
    await expect(this.activeOrderCard).toBeVisible();
    const signature = this.normalizeText(await this.activeOrderCard.textContent());

    if (!signature) {
      throw new Error('Не вдалося зчитати текст активної картки замовлення у CRM orders');
    }

    return signature;
  }

  async orderCardSignatures(): Promise<string[]> {
    return this.orderCards.evaluateAll((cards) =>
      cards.map((card) => card.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
    );
  }

  async openOrderCardByIndex(index: number): Promise<void> {
    const targetCard = this.orderCardByIndex(index);
    await expect(targetCard).toBeVisible();

    const cardTitle = this.normalizeText(
      await targetCard.locator('.ant-card-head-title').first().textContent(),
    );

    await targetCard.scrollIntoViewIfNeeded();
    const alreadyActive = await targetCard.evaluate((element) =>
      element.classList.contains('active'),
    );
    if (!alreadyActive) {
      const clickableArea = targetCard.locator('.ant-card-body').first();
      const clickTarget = (await clickableArea.count()) > 0 ? clickableArea : targetCard;

      try {
        await clickTarget.click();
      } catch {
        await clickTarget.evaluate((element) => {
          if ('click' in element && typeof element.click === 'function') {
            element.click();
          }
        });
      }
    }
    await expect
      .poll(() => targetCard.evaluate((element) => element.classList.contains('active')), {
        timeout: 10_000,
        message: `Після кліку картка #${index + 1} повинна стати активною`,
      })
      .toBe(true);
    await expect(this.detailsForm).toBeVisible();
    await expect(this.detailsOrderLabel).toContainText('Order ');
    this.log(`Обрано картку замовлення #${index + 1}${cardTitle ? `: ${cardTitle}` : ''}`);
  }

  async expectCurrentOrderLabelContains(text: string): Promise<void> {
    await expect(this.detailsOrderLabel).toContainText(text);
    this.log(`У правій панелі відкрито замовлення з ідентифікатором "${text}"`);
  }

  async enablePublicAccess(): Promise<void> {
    await expect(this.publicAccessCheckbox).toBeVisible();

    if (!(await this.publicAccessCheckbox.isChecked())) {
      await this.publicAccessCheckbox.check();
    }

    await expect(this.publicAccessCheckbox).toBeChecked();
    this.log('Увімкнено чекбокс "Публічний доступ"');
  }

  async confirmModeration(): Promise<void> {
    await expect(this.confirmButton).toBeEnabled();
    await this.confirmButton.click();
    this.log('Натиснуто кнопку "Підтвердити"');
  }

  async expectModerationSuccessMessages(): Promise<void> {
    await expect(this.successSavedToast).toBeVisible({ timeout: 15_000 });
    await expect(this.moderationConfirmedToast).toBeVisible({ timeout: 15_000 });
    this.log('З’явилися повідомлення про успішне збереження та підтвердження');
  }

  async waitForOrdersReloaded(): Promise<void> {
    await expect(this.ordersHeading).toBeVisible({ timeout: 15_000 });
    await expect(this.ordersSearchInput).toBeVisible({ timeout: 15_000 });
    const cardsCount = await this.orderCards.count();
    this.log(`Сторінка orders повторно завантажена після модерації, карток у черзі: ${cardsCount}`);
  }

  async expectOrderMissingBySignature(signature: string): Promise<void> {
    await expect
      .poll(() => this.orderCardSignatures(), {
        timeout: 15_000,
        message: 'Після модерації картка замовлення повинна зникнути зі списку',
      })
      .not.toContain(signature);

    this.log('Замовлення зникло зі списку після модерації');
  }

  async expectNoActiveOrderSelected(): Promise<void> {
    await expect(this.activeOrderCard).toHaveCount(0, { timeout: 15_000 });
    await expect(this.detailsForm).toHaveCount(0, { timeout: 15_000 });
    this.log('Після модерації активний ордер не відкритий, права панель порожня');
  }

  async selectOrderByIndex(index: number): Promise<string> {
    const previousOrderId = await this.currentOrderId();
    const targetCard = this.orderCardByIndex(index);

    await expect(targetCard).toBeVisible();
    await targetCard.click();
    await expect(targetCard).toHaveClass(/active/);

    await expect
      .poll(() => this.currentOrderId(), {
        timeout: 10_000,
        message: 'Після вибору іншої картки повинен змінитися orderId у правій панелі',
      })
      .not.toBe(previousOrderId);

    const nextOrderId = await this.currentOrderId();
    this.log(`Обрано картку замовлення #${index + 1}: ${nextOrderId}`);
    return nextOrderId;
  }
}
