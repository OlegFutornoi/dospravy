import type { TestDataFile } from '../../../../src/utils/data/load-test-data';
import { expect, test } from '../../../_shared/fixtures/app.fixture';
import { generateCrmContractorData } from '../../../_shared/factories/crm-contractor.factory';
import { ensureCrmCabinetByEmailPassword } from '../../../_shared/helpers/crm-cabinet-auth.flow';
import { CrmContractorsPage } from '../../../_shared/helpers/crm-contractors.page';

function requireContractorCreateData(testData: TestDataFile) {
  const contractorCreateData = testData.contractor?.create;

  if (!contractorCreateData) {
    throw new Error(
      'У data-файлі відсутні дані для створення контрактора: testData.contractor.create',
    );
  }

  return contractorCreateData;
}

test.describe('Смок: створення контрактора crm', () => {
  test('створює нового контрактора і знаходить його через пошук у таблиці', async ({
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
});
