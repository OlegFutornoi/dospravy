import type { TestDataFile } from '../../../../src/utils/data/load-test-data';
import { expect, test } from '../../../_shared/fixtures/app.fixture';
import { ensureCrmCabinetByEmailPassword } from '../../../_shared/helpers/crm-cabinet-auth.flow';
import { createCompanyWithRetry } from '../../../_shared/helpers/crm-company-create.flow';

function requireCompanyCreateData(testData: TestDataFile) {
  const companyCreateData = testData.company?.create;

  if (!companyCreateData) {
    throw new Error('У data-файлі відсутні дані для створення компанії: testData.company.create');
  }

  return companyCreateData;
}

test.describe('Смок: створення компанії crm', () => {
  test('створює нову компанію і показує її у таблиці', async ({ page, authData, testData }) => {
    const companyCreateData = requireCompanyCreateData(testData);
    expect(
      companyCreateData.companyNames.length,
      'У data-блоці company.create потрібні назви компаній',
    ).toBeGreaterThan(0);

    await ensureCrmCabinetByEmailPassword(page, authData);
    await createCompanyWithRetry(page, companyCreateData);
  });
});
