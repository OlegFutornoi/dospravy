import { expect, test } from '../../../_shared/fixtures/app.fixture';
import { ensureCrmCabinetByEmailPassword } from '../../../_shared/helpers/crm-cabinet-auth.flow';
import {
  processFirstFeedbackSuggestion,
  expectFeedbackSuggestionOutcome,
} from '../../../_shared/helpers/crm-feedback-suggestions.flow';
import { CrmFeedbackSuggestionsPage } from '../../../_shared/helpers/crm-feedback-suggestions.page';

test.describe('Смок: підтвердження пропозиції на зміну crm', () => {
  test.describe.configure({ mode: 'serial' });
  let initialSuggestionsCount = 0;

  test('підтверджує першу пропозицію на зміну і прибирає її зі списку', async ({
    page,
    authData,
  }) => {
    await ensureCrmCabinetByEmailPassword(page, authData);

    const suggestionsPage = new CrmFeedbackSuggestionsPage(page);
    const loadResult = await suggestionsPage.openFromSidebar();
    expect(
      loadResult.activeOrdersCount ?? loadResult.applyRequestsCount,
      'Після завантаження activeOrders повинні бути картки для обробки',
    ).not.toBe(0);

    const result = await processFirstFeedbackSuggestion(suggestionsPage, 'confirm');
    initialSuggestionsCount = result.beforeCount;
    expect(
      initialSuggestionsCount,
      'Для серії підтвердження + відмова на старті потрібно хоча б 2 картки',
    ).toBeGreaterThanOrEqual(2);
    expectFeedbackSuggestionOutcome(result, 'confirmed');
  });

  test('відмовляє по наступній пропозиції і залишає очікувану кількість карток у списку', async ({
    page,
    authData,
  }) => {
    expect(
      initialSuggestionsCount,
      'Перед другим кроком має бути відома стартова кількість карток із першого тесту',
    ).toBeGreaterThanOrEqual(2);

    await ensureCrmCabinetByEmailPassword(page, authData);

    const suggestionsPage = new CrmFeedbackSuggestionsPage(page);
    const loadResult = await suggestionsPage.openFromSidebar();
    expect(
      loadResult.activeOrdersCount ?? loadResult.applyRequestsCount,
      'Перед відмовою на сторінці повинні залишатись картки для обробки',
    ).not.toBe(0);

    const result = await processFirstFeedbackSuggestion(suggestionsPage, 'reject');
    expectFeedbackSuggestionOutcome(result, 'rejected');
    await suggestionsPage.expectSuggestionsCount(Math.max(initialSuggestionsCount - 2, 0));
  });
});
