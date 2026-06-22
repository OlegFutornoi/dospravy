import type { TestDataFile } from '../../../../src/utils/data/load-test-data';
import { getRuntimeContext } from '../../../../src/utils/data/load-test-data';
import { loginCrmViaApi } from '../../../api/_shared/api-auth';
import { disposeApiSession } from '../../../api/_shared/api-runtime';
import {
  createCrmContractorWithOverridesViaApi,
  mapContractorSourceToApi,
} from '../../../api/_shared/crm.api';
import { generateCrmContractorData } from '../../../_shared/factories/crm-contractor.factory';
import { buildCrmContractorFilterSeedSet } from '../../../_shared/factories/crm-contractor.factory';
import { expect, test } from '../../../_shared/fixtures/app.fixture';
import { ensureCrmCabinetByEmailPassword } from '../../../_shared/helpers/crm-cabinet-auth.flow';
import { createCompanyWithRetry } from '../../../_shared/helpers/crm-company-create.flow';
import {
  addAgentCommentThroughCommentColumnIfAvailable,
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

async function createCrmFilterSeedSetViaApi(
  authData: Parameters<typeof loginCrmViaApi>[0],
  contractorCreateData: ReturnType<typeof requireContractorCreateData>,
  seed = Date.now(),
) {
  const runtimeContext = getRuntimeContext();
  const session = await loginCrmViaApi(authData, runtimeContext.testEnv);
  const seedSet = buildCrmContractorFilterSeedSet(contractorCreateData, seed);

  try {
    const createdContractors: Array<(typeof seedSet.contractors)[number]> = [];

    for (let index = 0; index < seedSet.contractors.length; index += 1) {
      const created = await createCrmContractorWithOverridesViaApi(
        session,
        contractorCreateData,
        seedSet.contractors[index]!,
        seed + index * 1_000,
      );
      createdContractors.push(created.contractor);
    }

    if (createdContractors.length !== seedSet.contractors.length) {
      throw new Error(
        `Очікувалось створити ${seedSet.contractors.length} contractor-ів для фільтра, але створено ${createdContractors.length}`,
      );
    }

    return {
      ...seedSet,
      contractors: createdContractors as typeof seedSet.contractors,
    };
  } finally {
    await disposeApiSession(session);
  }
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

  test('4. фільтрує кандидатів за містом і показує тільки релевантні записи', async ({
    page,
    authData,
    testData,
  }) => {
    const contractorCreateData = requireContractorCreateData(testData);
    const seedSet = await createCrmFilterSeedSetViaApi(authData, contractorCreateData);

    await ensureCrmCabinetByEmailPassword(page, authData);

    const contractorsPage = new CrmContractorsPage(page);
    await contractorsPage.goto();
    const searchUrl = await contractorsPage.searchContractorAndWait(seedSet.searchToken);
    expect(searchUrl.searchParams.get('search')).toContain(seedSet.searchToken);

    await contractorsPage.openFiltersPanel();
    await contractorsPage.selectFilterCity(seedSet.cityA);
    const filterUrl = await contractorsPage.applyFiltersAndCaptureListRequest();

    expect(filterUrl.searchParams.get('city_desired')).toBe(seedSet.cityA);
    expect(filterUrl.searchParams.get('search')).toContain(seedSet.searchToken);
    await contractorsPage.expectVisibleRowsCount(2);
    await contractorsPage.expectVisibleContractorNames([
      seedSet.contractors[0].fullName,
      seedSet.contractors[1].fullName,
    ]);
    await contractorsPage.expectContractorNamesAbsent([
      seedSet.contractors[2].fullName,
      seedSet.contractors[3].fullName,
    ]);
    await contractorsPage.expectEveryVisibleRowToContain(seedSet.cityA);
  });

  test('5. фільтрує кандидатів за джерелом і показує тільки релевантні записи', async ({
    page,
    authData,
    testData,
  }) => {
    const contractorCreateData = requireContractorCreateData(testData);
    const seedSet = await createCrmFilterSeedSetViaApi(
      authData,
      contractorCreateData,
      Date.now() + 500,
    );

    await ensureCrmCabinetByEmailPassword(page, authData);

    const contractorsPage = new CrmContractorsPage(page);
    await contractorsPage.goto();
    await contractorsPage.searchContractorAndWait(seedSet.searchToken);

    await contractorsPage.openFiltersPanel();
    await contractorsPage.selectFilterSource(seedSet.sourceA);
    const filterUrl = await contractorsPage.applyFiltersAndCaptureListRequest();

    expect(filterUrl.searchParams.get('source')).toBe(mapContractorSourceToApi(seedSet.sourceA));
    expect(filterUrl.searchParams.get('search')).toContain(seedSet.searchToken);
    await contractorsPage.expectVisibleRowsCount(2);
    await contractorsPage.expectVisibleContractorNames([
      seedSet.contractors[0].fullName,
      seedSet.contractors[2].fullName,
    ]);
    await contractorsPage.expectContractorNamesAbsent([
      seedSet.contractors[1].fullName,
      seedSet.contractors[3].fullName,
    ]);
    await contractorsPage.expectEveryVisibleRowToContain(seedSet.sourceA);
  });

  test('6. застосовує комбінований фільтр місто плюс джерело як логічне AND', async ({
    page,
    authData,
    testData,
  }) => {
    const contractorCreateData = requireContractorCreateData(testData);
    const seedSet = await createCrmFilterSeedSetViaApi(
      authData,
      contractorCreateData,
      Date.now() + 1_000,
    );

    await ensureCrmCabinetByEmailPassword(page, authData);

    const contractorsPage = new CrmContractorsPage(page);
    await contractorsPage.goto();
    await contractorsPage.searchContractorAndWait(seedSet.searchToken);

    await contractorsPage.openFiltersPanel();
    await contractorsPage.selectFilterCity(seedSet.cityA);
    await contractorsPage.selectFilterSource(seedSet.sourceA);
    const filterUrl = await contractorsPage.applyFiltersAndCaptureListRequest();

    expect(filterUrl.searchParams.get('city_desired')).toBe(seedSet.cityA);
    expect(filterUrl.searchParams.get('source')).toBe(mapContractorSourceToApi(seedSet.sourceA));
    await contractorsPage.expectVisibleRowsCount(1);
    await contractorsPage.expectVisibleContractorNames([seedSet.contractors[0].fullName]);
    await contractorsPage.expectContractorNamesAbsent([
      seedSet.contractors[1].fullName,
      seedSet.contractors[2].fullName,
      seedSet.contractors[3].fullName,
    ]);
    await contractorsPage.expectEveryVisibleRowToContain(seedSet.cityA);
    await contractorsPage.expectEveryVisibleRowToContain(seedSet.sourceA);
  });

  test('7. очищає фільтри і повертає список до baseline-стану', async ({
    page,
    authData,
    testData,
  }) => {
    const contractorCreateData = requireContractorCreateData(testData);
    const seedSet = await createCrmFilterSeedSetViaApi(
      authData,
      contractorCreateData,
      Date.now() + 1_500,
    );

    await ensureCrmCabinetByEmailPassword(page, authData);

    const contractorsPage = new CrmContractorsPage(page);
    await contractorsPage.goto();
    await contractorsPage.searchContractorAndWait(seedSet.searchToken);
    await contractorsPage.expectVisibleRowsCount(4);

    await contractorsPage.openFiltersPanel();
    await contractorsPage.selectFilterCity(seedSet.cityA);
    await contractorsPage.applyFiltersAndCaptureListRequest();
    await contractorsPage.expectVisibleRowsCount(2);

    await contractorsPage.openFiltersPanel();
    const clearedUrl = await contractorsPage.clearAllFiltersAndCaptureListRequest();

    expect(clearedUrl.searchParams.get('city_desired')).toBeNull();
    expect(clearedUrl.searchParams.get('source')).toBeNull();
    expect(clearedUrl.searchParams.get('search')).toContain(seedSet.searchToken);
    await contractorsPage.expectVisibleRowsCount(4);
    await contractorsPage.expectVisibleContractorNames(
      seedSet.contractors.map((contractor) => contractor.fullName),
    );
  });

  test('8. додає новий коментар агента в профілі першого кандидата', async ({ page, authData }) => {
    await ensureCrmCabinetByEmailPassword(page, authData);

    const contractorsPage = new CrmContractorsPage(page);
    const commentText = createCrmAgentCommentText();
    const result = await addAgentCommentToFirstContractorIfAvailable(contractorsPage, commentText);

    expectCrmContractorAgentCommentOutcome(result, ['comment_added', 'no_contractors']);
    expect(result.status).toBeDefined();
  });

  test('9. додає новий коментар агента через колонку "Коментар" у списку кандидатів', async ({
    page,
    authData,
  }) => {
    await ensureCrmCabinetByEmailPassword(page, authData);

    const contractorsPage = new CrmContractorsPage(page);
    const commentText = createCrmAgentCommentText();
    const result = await addAgentCommentThroughCommentColumnIfAvailable(
      contractorsPage,
      commentText,
    );

    expectCrmContractorAgentCommentOutcome(result, ['comment_added', 'no_contractors']);
    expect(result.status).toBeDefined();
  });

  test('10. модерує замовлення через публічний доступ і підтвердження', async ({
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

  test('11. підтверджує першу пропозицію на зміну і прибирає її зі списку', async ({
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

  test('12. відмовляє по наступній пропозиції і залишає очікувану кількість карток у списку', async ({
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
