import { test, expect } from '@playwright/test';
import { loginCrmViaApi } from '../../_shared/api-auth';
import { createCrmCompanyViaApi } from '../../_shared/crm.api';
import { disposeApiSession } from '../../_shared/api-runtime';
import { getRuntimeContext, loadCabinetAreaData } from '../../../../src/utils/data/load-test-data';

test('api smoke: crm створює нову компанію', async () => {
  const runtimeContext = getRuntimeContext();
  const { authData, testData } = loadCabinetAreaData(runtimeContext.testEnv, 'crm');
  const session = await loginCrmViaApi(authData, runtimeContext.testEnv);

  try {
    expect(testData.company?.create).toBeTruthy();
    const createdCompany = await createCrmCompanyViaApi(session, testData.company!.create);

    expect(createdCompany.companyId).toBeTruthy();
    expect(createdCompany.companyName).toBeTruthy();
  } finally {
    await disposeApiSession(session);
  }
});
