import type { TestDataFile } from '../../../../src/utils/data/load-test-data';
import { generateCrmContractorData } from '../../../_shared/factories/crm-contractor.factory';
import { expect, test } from '../../../_shared/fixtures/app.fixture';
import { ensureCrmCabinetByEmailPassword } from '../../../_shared/helpers/crm-cabinet-auth.flow';
import { createCompanyWithRetry } from '../../../_shared/helpers/crm-company-create.flow';
import {
  addAgentCommentToFirstContractorIfAvailable,
  createCrmAgentCommentText,
  expectCrmContractorAgentCommentOutcome,
} from '../../../_shared/helpers/crm-contractor-agent-comments.flow';
import { CrmContractorsPage } from '../../../_shared/helpers/crm-contractors.page';
import {
  expectFeedbackSuggestionOutcome,
  processFirstFeedbackSuggestionIfAvailable,
  processRejectSuggestionIfAvailable,
} from '../../../_shared/helpers/crm-feedback-suggestions.flow';
import { CrmFeedbackSuggestionsPage } from '../../../_shared/helpers/crm-feedback-suggestions.page';
import { CrmLoginPage } from '../../../_shared/helpers/crm-login.page';
import {
  expectModerationOutcome,
  moderateOrderWithPublicAccess,
} from '../../../_shared/helpers/crm-order-moderation.flow';
import { CrmOrdersPage } from '../../../_shared/helpers/crm-orders.page';

function requireContractorCreateData(testData: TestDataFile) {
  const contractorCreateData = testData.contractor?.create;

  if (!contractorCreateData) {
    throw new Error(
      'У data-файлі відсутні дані для створення контрактора: testData.contractor.create',
    );
  }

  return contractorCreateData;
}

function requireCompanyCreateData(testData: TestDataFile) {
  const companyCreateData = testData.company?.create;

  if (!companyCreateData) {
    throw new Error('У data-файлі відсутні дані для створення компанії: testData.company.create');
  }

  return companyCreateData;
}

test.describe('Регресія: crm', () => {
  test.describe.configure({ mode: 'serial' });
  let initialSuggestionsCount = 0;

  test('1. авторизує через email і пароль', async ({ page, authData }) => {
    const loginPage = new CrmLoginPage(page);

    await loginPage.goto();
    const response = await loginPage.loginByEmail(
      authData.auth.emailPassword.email,
      authData.auth.emailPassword.password,
    );

    expect(response.status(), 'CRM login API повинно повернути 200').toBe(200);
    await loginPage.expectAuthorized();
  });

  test('2. створює нову компанію і показує її у таблиці', async ({ page, authData, testData }) => {
    const companyCreateData = requireCompanyCreateData(testData);

    expect(
      companyCreateData.companyNames.length,
      'У data-блоці company.create потрібні назви компаній',
    ).toBeGreaterThan(0);

    await ensureCrmCabinetByEmailPassword(page, authData);
    await createCompanyWithRetry(page, companyCreateData);
  });

  test('3. створює нового контрактора і знаходить його через пошук у таблиці', async ({
    page,
    authData,
    testData,
  }) => {
    const contractor = generateCrmContractorData(requireContractorCreateData(testData));

    expect(contractor.phone, 'Телефон для вводу в масковане поле повинен починатися з 77').toMatch(
      /^77\d{7}$/,
    );

    await ensureCrmCabinetByEmailPassword(page, authData);

    const contractorsPage = new CrmContractorsPage(page);
    await contractorsPage.goto();
    await contractorsPage.openCreateContractorModal();
    await contractorsPage.fillCreateContractorForm(contractor);
    await contractorsPage.submitCreateContractorForm();
    await contractorsPage.searchContractor(contractor.fullName);
    await contractorsPage.expectContractorVisibleInTable(contractor);
  });

  test('4. додає новий коментар агента в профілі першого кандидата', async ({ page, authData }) => {
    await ensureCrmCabinetByEmailPassword(page, authData);

    const contractorsPage = new CrmContractorsPage(page);
    const commentText = createCrmAgentCommentText();
    const result = await addAgentCommentToFirstContractorIfAvailable(contractorsPage, commentText);

    expectCrmContractorAgentCommentOutcome(result, ['comment_added', 'no_contractors']);
    expect(result.status).toBeDefined();
  });

  test('5. модерує замовлення через публічний доступ і підтвердження', async ({
    page,
    authData,
  }) => {
    await ensureCrmCabinetByEmailPassword(page, authData);

    const ordersPage = new CrmOrdersPage(page);
    await ordersPage.goto();

    const moderatedOrder = await moderateOrderWithPublicAccess(ordersPage);
    expect(['moderated', 'no_orders']).toContain(moderatedOrder.status);
    expectModerationOutcome(moderatedOrder);
  });

  test('6. підтверджує першу пропозицію на зміну і прибирає її зі списку', async ({
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

    const result = await processFirstFeedbackSuggestionIfAvailable(suggestionsPage, 'confirm');
    initialSuggestionsCount = result.beforeCount;
    expectFeedbackSuggestionOutcome(result, ['confirmed', 'no_suggestions']);
    expect(result.status).toBeDefined();
  });

  test('7. відмовляє по наступній пропозиції і залишає очікувану кількість карток у списку', async ({
    page,
    authData,
  }) => {
    await ensureCrmCabinetByEmailPassword(page, authData);

    const suggestionsPage = new CrmFeedbackSuggestionsPage(page);
    const loadResult = await suggestionsPage.openFromSidebar();
    expect(
      loadResult.activeOrdersCount ?? loadResult.applyRequestsCount,
      'Перед відмовою на сторінці повинні залишатись картки для обробки',
    ).not.toBe(0);

    const result = await processRejectSuggestionIfAvailable(
      suggestionsPage,
      initialSuggestionsCount,
    );
    expectFeedbackSuggestionOutcome(result, ['rejected', 'not_enough_suggestions_for_reject']);
    expect(result.status).toBeDefined();
  });
});
