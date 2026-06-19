import { expect, test } from '../../../_shared/fixtures/app.fixture';
import { ensureCrmCabinetByEmailPassword } from '../../../_shared/helpers/crm-cabinet-auth.flow';
import {
  processFirstFeedbackSuggestionIfAvailable,
  processRejectSuggestionIfAvailable,
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
    await suggestionsPage.openFromSidebar();

    const result = await processFirstFeedbackSuggestionIfAvailable(suggestionsPage, 'confirm');
    initialSuggestionsCount = result.beforeCount;
    expectFeedbackSuggestionOutcome(result, ['confirmed', 'no_suggestions']);
    expect(result.status).toBeDefined();
  });

  test('відмовляє по наступній пропозиції і залишає очікувану кількість карток у списку', async ({
    page,
    authData,
  }) => {
    await ensureCrmCabinetByEmailPassword(page, authData);

    const suggestionsPage = new CrmFeedbackSuggestionsPage(page);
    await suggestionsPage.openFromSidebar();

    const result = await processRejectSuggestionIfAvailable(
      suggestionsPage,
      initialSuggestionsCount,
    );
    expectFeedbackSuggestionOutcome(result, ['rejected', 'not_enough_suggestions_for_reject']);
    expect(result.status).toBeDefined();
  });
});
