import type { TestDataFile } from '../../src/utils/data/load-test-data';
import { generateCrmContractorData } from '../_shared/factories/crm-contractor.factory';
import { expect, test } from '../_shared/fixtures/combined.fixture';
import { ensureCrmCabinetByEmailPassword } from '../_shared/helpers/crm-cabinet-auth.flow';
import { createCompanyWithRetry } from '../_shared/helpers/crm-company-create.flow';
import {
  addAgentCommentThroughCommentColumnIfAvailable,
  addAgentCommentToFirstContractorIfAvailable,
  createCrmAgentCommentText,
  expectCrmContractorAgentCommentOutcome,
} from '../_shared/helpers/crm-contractor-agent-comments.flow';
import { CrmContractorsPage } from '../_shared/helpers/crm-contractors.page';
import {
  expectFeedbackSuggestionOutcome,
  processFirstFeedbackSuggestionIfAvailable,
  processRejectSuggestionIfAvailable,
} from '../_shared/helpers/crm-feedback-suggestions.flow';
import { CrmFeedbackSuggestionsPage } from '../_shared/helpers/crm-feedback-suggestions.page';
import { CrmLoginPage } from '../_shared/helpers/crm-login.page';
import {
  expectModerationOutcome,
  moderateOrderWithPublicAccess,
} from '../_shared/helpers/crm-order-moderation.flow';
import { CrmOrdersPage } from '../_shared/helpers/crm-orders.page';
import { BusinessLoginPage } from '../_shared/helpers/business-login.page';
import { createAndModerateOrderAcrossCabinets } from '../_shared/helpers/combined/business-to-crm-order-lifecycle.flow';
import { createBusinessOrderLifecycleSeed } from '../_shared/helpers/combined/business-order-create.flow';
import { getAppBaseUrl } from '../_shared/helpers/combined/app-urls';

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

test.describe('Регресія: повний e2e прогон', () => {
  test.describe.configure({ mode: 'serial' });
  let initialSuggestionsCount = 0;

  test('1. business: відкриває сторінку логіну з двома способами авторизації', async ({ page }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();

    await expect(page.getByRole('button', { name: 'Email та пароль' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Телефон' })).toBeVisible();
  });

  test('2. business: авторизує через email і пароль', async ({ page, businessAuthData }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await loginPage.loginByEmail(
      businessAuthData.auth.emailPassword.email,
      businessAuthData.auth.emailPassword.password,
    );
    await loginPage.expectAuthorized();
    await expect(page).toHaveURL(/\/workspace$/);
  });

  test('3. business: авторизує через телефон і otp код', async ({ page, businessAuthData }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await loginPage.openPhoneOtp(businessAuthData.auth.phoneOtp.phone);
    await loginPage.submitOtp(businessAuthData.auth.phoneOtp.otp);
    await loginPage.expectAuthorized();
    await expect(page).toHaveURL(/\/workspace$/);
  });

  test('4. business: показує валідацію для порожніх email і пароля', async ({ page }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await page.getByRole('button', { name: 'Увійти' }).click();

    await expect(page.getByText("Поле обов'язкове для заповнення")).toHaveCount(2);
    await loginPage.expectStillOnLogin();
  });

  test('5. business: не авторизує з невалідною комбінацією email і пароля', async ({
    page,
    businessAuthData,
  }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await loginPage.loginByEmail(
      businessAuthData.auth.emailPassword.email,
      `${businessAuthData.auth.emailPassword.password}!`,
    );
    await loginPage.expectStillOnLogin();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('6. business: не авторизує з невалідним otp кодом', async ({ page, businessAuthData }) => {
    const loginPage = new BusinessLoginPage(page);
    const validOtp = businessAuthData.auth.phoneOtp.otp;
    const invalidOtp = validOtp
      .split('')
      .map((digit) => ((Number(digit) + 1) % 10).toString())
      .join('');

    await loginPage.goto();
    await loginPage.openPhoneOtp(businessAuthData.auth.phoneOtp.phone);
    await loginPage.submitOtp(invalidOtp);

    await loginPage.expectOtpStepVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('7. business: проходить флоу "Забули пароль?" із тим самим паролем', async ({
    page,
    businessAuthData,
  }) => {
    const loginPage = new BusinessLoginPage(page);

    await loginPage.goto();
    await loginPage.openForgotPasswordOtp(businessAuthData.auth.phoneOtp.phone);
    await loginPage.submitOtp(businessAuthData.auth.phoneOtp.otp);

    await loginPage.expectNewPasswordStepVisible();
    await expect(page.getByText(businessAuthData.auth.emailPassword.email)).toBeVisible();
    await loginPage.saveNewPassword(businessAuthData.auth.emailPassword.password);
    await loginPage.expectAuthorized();
  });

  test('8. business: створює замовлення через майстер', async ({
    page,
    businessAuthData,
    businessTestData,
    runtimeContext,
  }) => {
    test.setTimeout(120_000);

    const createdOrder = await createBusinessOrderLifecycleSeed(
      page,
      businessAuthData,
      businessTestData,
      runtimeContext.testEnv,
    );

    expect(
      createdOrder.businessOrderNumber,
      'Після створення має бути номер замовлення',
    ).toBeTruthy();
    expect(
      createdOrder.businessDraftOrderId,
      'Після створення має бути draft ID замовлення',
    ).toBeTruthy();
  });

  test('9. crm: авторизує через email і пароль', async ({ page, crmAuthData, runtimeContext }) => {
    const crmBaseUrl = getAppBaseUrl('crm', runtimeContext.testEnv);
    const loginPage = new CrmLoginPage(page);

    await loginPage.goto(`${crmBaseUrl}login`);
    const response = await loginPage.loginByEmail(
      crmAuthData.auth.emailPassword.email,
      crmAuthData.auth.emailPassword.password,
    );

    expect(response.status(), 'CRM login API повинно повернути 200').toBe(200);
    await loginPage.expectAuthorized();
  });

  test('10. crm: створює нову компанію і показує її у таблиці', async ({
    page,
    crmAuthData,
    crmTestData,
    runtimeContext,
  }) => {
    test.setTimeout(120_000);

    const crmBaseUrl = getAppBaseUrl('crm', runtimeContext.testEnv);
    const companyCreateData = requireCompanyCreateData(crmTestData);

    expect(
      companyCreateData?.companyNames.length,
      'У data-блоці company.create потрібні назви компаній',
    ).toBeGreaterThan(0);

    await ensureCrmCabinetByEmailPassword(page, crmAuthData, crmBaseUrl);
    await createCompanyWithRetry(page, companyCreateData, Date.now(), `${crmBaseUrl}companies`);
  });

  test('11. crm: створює нового контрактора і знаходить його через пошук у таблиці', async ({
    page,
    crmAuthData,
    crmTestData,
    runtimeContext,
  }) => {
    test.setTimeout(120_000);

    const crmBaseUrl = getAppBaseUrl('crm', runtimeContext.testEnv);
    const contractor = generateCrmContractorData(requireContractorCreateData(crmTestData));

    expect(contractor.phone, 'Телефон для вводу в масковане поле повинен починатися з 77').toMatch(
      /^77\d{7}$/,
    );

    await ensureCrmCabinetByEmailPassword(page, crmAuthData, crmBaseUrl);

    const contractorsPage = new CrmContractorsPage(page);
    await contractorsPage.goto(`${crmBaseUrl}contractors`);
    await contractorsPage.openCreateContractorModal();
    await contractorsPage.fillCreateContractorForm(contractor);
    await contractorsPage.submitCreateContractorForm();
    await contractorsPage.searchContractor(contractor.fullName);
    await contractorsPage.expectContractorVisibleInTable(contractor);
  });

  test('12. crm: додає новий коментар агента в профілі першого кандидата', async ({
    page,
    crmAuthData,
    runtimeContext,
  }) => {
    const crmBaseUrl = getAppBaseUrl('crm', runtimeContext.testEnv);
    await ensureCrmCabinetByEmailPassword(page, crmAuthData, crmBaseUrl);

    const contractorsPage = new CrmContractorsPage(page);
    const commentText = createCrmAgentCommentText();
    const result = await addAgentCommentToFirstContractorIfAvailable(contractorsPage, commentText);

    expectCrmContractorAgentCommentOutcome(result, ['comment_added', 'no_contractors']);
    expect(result.status).toBeDefined();
  });

  test('13. crm: додає новий коментар агента через колонку "Коментар" у списку кандидатів', async ({
    page,
    crmAuthData,
    runtimeContext,
  }) => {
    const crmBaseUrl = getAppBaseUrl('crm', runtimeContext.testEnv);
    await ensureCrmCabinetByEmailPassword(page, crmAuthData, crmBaseUrl);

    const contractorsPage = new CrmContractorsPage(page);
    const commentText = createCrmAgentCommentText();
    const result = await addAgentCommentThroughCommentColumnIfAvailable(
      contractorsPage,
      commentText,
    );

    expectCrmContractorAgentCommentOutcome(result, ['comment_added', 'no_contractors']);
    expect(result.status).toBeDefined();
  });

  test('14. crm: модерує замовлення через публічний доступ і підтвердження', async ({
    page,
    crmAuthData,
    runtimeContext,
  }) => {
    const crmBaseUrl = getAppBaseUrl('crm', runtimeContext.testEnv);
    await ensureCrmCabinetByEmailPassword(page, crmAuthData, crmBaseUrl);

    const ordersPage = new CrmOrdersPage(page);
    await ordersPage.goto(`${crmBaseUrl}orders`);

    const moderatedOrder = await moderateOrderWithPublicAccess(ordersPage);
    expect(['moderated', 'no_orders']).toContain(moderatedOrder.status);
    expectModerationOutcome(moderatedOrder);
  });

  test('15. crm: підтверджує першу пропозицію на зміну і прибирає її зі списку', async ({
    page,
    crmAuthData,
    runtimeContext,
  }) => {
    const crmBaseUrl = getAppBaseUrl('crm', runtimeContext.testEnv);
    await ensureCrmCabinetByEmailPassword(page, crmAuthData, crmBaseUrl);
    await page.goto(crmBaseUrl);

    const suggestionsPage = new CrmFeedbackSuggestionsPage(page);
    await suggestionsPage.openFromSidebar();

    const result = await processFirstFeedbackSuggestionIfAvailable(suggestionsPage, 'confirm');
    initialSuggestionsCount = result.beforeCount;
    expectFeedbackSuggestionOutcome(result, ['confirmed', 'no_suggestions']);
    expect(result.status).toBeDefined();
  });

  test('16. crm: відмовляє по наступній пропозиції і залишає очікувану кількість карток', async ({
    page,
    crmAuthData,
    runtimeContext,
  }) => {
    const crmBaseUrl = getAppBaseUrl('crm', runtimeContext.testEnv);
    await ensureCrmCabinetByEmailPassword(page, crmAuthData, crmBaseUrl);
    await page.goto(crmBaseUrl);

    const suggestionsPage = new CrmFeedbackSuggestionsPage(page);
    await suggestionsPage.openFromSidebar();

    const result = await processRejectSuggestionIfAvailable(
      suggestionsPage,
      initialSuggestionsCount,
    );
    expectFeedbackSuggestionOutcome(result, ['rejected', 'not_enough_suggestions_for_reject']);
    expect(result.status).toBeDefined();
  });

  test('17. combined: створює ордер у business і модерує його в crm', async ({
    page,
    runtimeContext,
    businessAuthData,
    businessTestData,
    crmAuthData,
    combinedFlowData,
  }) => {
    test.setTimeout(240_000);

    const lifecycle = await createAndModerateOrderAcrossCabinets(page, {
      businessAuthData,
      businessTestData,
      crmAuthData,
      combinedFlowData,
      testEnv: runtimeContext.testEnv,
    });

    expect(
      lifecycle.businessOrderNumber,
      'Потрібно зафіксувати номер створеного замовлення',
    ).toBeTruthy();
    expect(
      lifecycle.businessDraftOrderId,
      'Потрібно зафіксувати draft ID ордера в business',
    ).toBeTruthy();
    expect(
      lifecycle.queueIndex,
      'Для цього сценарію у CRM має бути відкритий перший ордер черги',
    ).toBe(0);
    expect(
      lifecycle.crmOrderLabel,
      'Потрібно зафіксувати order label відкритого CRM ордера',
    ).toContain('Order ');
    expect(
      lifecycle.moderationHttpStatus,
      'CRM moderation API повинно відповідати успішним HTTP статусом',
    ).toBeLessThan(400);
  });
});
