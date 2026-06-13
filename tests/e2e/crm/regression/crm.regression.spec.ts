import type { TestDataFile } from '../../../../src/utils/data/load-test-data';
import { generateCrmContractorData } from '../../../_shared/factories/crm-contractor.factory';
import { expect, test } from '../../../_shared/fixtures/app.fixture';
import { ensureCrmCabinetByEmailPassword } from '../../../_shared/helpers/crm-cabinet-auth.flow';
import { createCompanyWithRetry } from '../../../_shared/helpers/crm-company-create.flow';
import { CrmContractorsPage } from '../../../_shared/helpers/crm-contractors.page';
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

  test('4. модерує замовлення через публічний доступ і підтвердження', async ({
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
});
