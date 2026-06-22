import { test, expect } from '@playwright/test';
import { loginBusinessViaApi, loginCrmViaApi } from '../../_shared/api-auth';
import { disposeApiSession } from '../../_shared/api-runtime';
import { createBusinessOrderViaApi } from '../../_shared/business-orders.api';
import {
  addAgentCommentToContractorViaApi,
  createCrmAgentCommentText,
  createCrmCompanyViaApi,
  createCrmContractorViaApi,
  createCrmContractorWithOverridesViaApi,
  listCrmContractorsViaApi,
  mapContractorSourceToApi,
  moderateOrderViaApi,
} from '../../_shared/crm.api';
import { buildCrmContractorFilterSeedSet } from '../../../_shared/factories/crm-contractor.factory';
import { getRuntimeContext, loadCabinetAreaData } from '../../../../src/utils/data/load-test-data';

async function createCrmFilterSeedSetViaApi(
  authData: ReturnType<typeof loadCabinetAreaData>['authData'],
  contractorCreateData: NonNullable<
    ReturnType<typeof loadCabinetAreaData>['testData']['contractor']
  >['create'],
  testEnv: ReturnType<typeof getRuntimeContext>['testEnv'],
  seed = Date.now(),
) {
  const session = await loginCrmViaApi(authData, testEnv);
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
      throw new Error('Не вдалося підготувати повний seed-набір кандидатів для фільтра');
    }

    return {
      ...seedSet,
      contractors: createdContractors as typeof seedSet.contractors,
    };
  } finally {
    await disposeApiSession(session);
  }
}

test.describe('Регресія: crm api', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. api: crm створює нову компанію', async () => {
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

  test('2. api: crm створює нового контрактора', async () => {
    const runtimeContext = getRuntimeContext();
    const { authData, testData } = loadCabinetAreaData(runtimeContext.testEnv, 'crm');
    const session = await loginCrmViaApi(authData, runtimeContext.testEnv);

    try {
      expect(testData.contractor?.create).toBeTruthy();
      const createdContractor = await createCrmContractorViaApi(
        session,
        testData.contractor!.create,
      );

      expect(createdContractor.contractorId).toBeTruthy();
      expect(createdContractor.fullName).toBeTruthy();
    } finally {
      await disposeApiSession(session);
    }
  });

  test('3. api: crm додає коментар агента до нового контрактора', async () => {
    const runtimeContext = getRuntimeContext();
    const { authData, testData } = loadCabinetAreaData(runtimeContext.testEnv, 'crm');
    const session = await loginCrmViaApi(authData, runtimeContext.testEnv);

    try {
      expect(testData.contractor?.create).toBeTruthy();
      const createdContractor = await createCrmContractorViaApi(
        session,
        testData.contractor!.create,
      );
      const commentText = createCrmAgentCommentText();
      const commentResult = await addAgentCommentToContractorViaApi(
        session,
        createdContractor.contractorId,
        commentText,
      );

      expect(commentResult.contractorId).toBe(createdContractor.contractorId);
      expect(commentResult.commentId).toBeTruthy();
    } finally {
      await disposeApiSession(session);
    }
  });

  test('4. api: crm додає коментар агента у сценарії колонки "Коментар"', async () => {
    const runtimeContext = getRuntimeContext();
    const { authData, testData } = loadCabinetAreaData(runtimeContext.testEnv, 'crm');
    const session = await loginCrmViaApi(authData, runtimeContext.testEnv);

    try {
      expect(testData.contractor?.create).toBeTruthy();
      const createdContractor = await createCrmContractorViaApi(
        session,
        testData.contractor!.create,
      );
      const commentText = createCrmAgentCommentText(Date.now() + 1);
      const commentResult = await addAgentCommentToContractorViaApi(
        session,
        createdContractor.contractorId,
        commentText,
      );

      expect(commentResult.contractorId).toBe(createdContractor.contractorId);
      expect(commentResult.commentId).toBeTruthy();
    } finally {
      await disposeApiSession(session);
    }
  });

  test('5. api: crm фільтрує кандидатів за містом', async () => {
    const runtimeContext = getRuntimeContext();
    const { authData, testData } = loadCabinetAreaData(runtimeContext.testEnv, 'crm');
    const contractorCreateData = testData.contractor?.create;

    expect(contractorCreateData).toBeTruthy();
    const seedSet = await createCrmFilterSeedSetViaApi(
      authData,
      contractorCreateData!,
      runtimeContext.testEnv,
    );
    const session = await loginCrmViaApi(authData, runtimeContext.testEnv);

    try {
      const filtered = await listCrmContractorsViaApi(session, {
        search: seedSet.searchToken,
        cityDesired: seedSet.cityA,
      });

      expect(filtered.results).toHaveLength(2);
      expect(
        filtered.results.every((item) => item.city_desired === seedSet.cityA),
        'Кожен запис у відповіді має відповідати вибраному місту',
      ).toBe(true);
      expect(filtered.results.map((item) => `${item.first_name} ${item.last_name}`).sort()).toEqual(
        [seedSet.contractors[0].fullName, seedSet.contractors[1].fullName].sort(),
      );
    } finally {
      await disposeApiSession(session);
    }
  });

  test('6. api: crm комбінує місто і джерело як логічне AND', async () => {
    const runtimeContext = getRuntimeContext();
    const { authData, testData } = loadCabinetAreaData(runtimeContext.testEnv, 'crm');
    const contractorCreateData = testData.contractor?.create;

    expect(contractorCreateData).toBeTruthy();
    const seedSet = await createCrmFilterSeedSetViaApi(
      authData,
      contractorCreateData!,
      runtimeContext.testEnv,
      Date.now() + 500,
    );
    const session = await loginCrmViaApi(authData, runtimeContext.testEnv);

    try {
      const filtered = await listCrmContractorsViaApi(session, {
        search: seedSet.searchToken,
        cityDesired: seedSet.cityA,
        source: mapContractorSourceToApi(seedSet.sourceA),
      });

      expect(filtered.results).toHaveLength(1);
      expect(filtered.results[0]?.city_desired).toBe(seedSet.cityA);
      expect(filtered.results[0]?.source).toBe(mapContractorSourceToApi(seedSet.sourceA));
      expect(`${filtered.results[0]?.first_name} ${filtered.results[0]?.last_name}`).toBe(
        seedSet.contractors[0].fullName,
      );
    } finally {
      await disposeApiSession(session);
    }
  });

  test('7. api: crm модерує щойно створене замовлення', async () => {
    const runtimeContext = getRuntimeContext();
    const businessData = loadCabinetAreaData(runtimeContext.testEnv, 'business');
    const crmData = loadCabinetAreaData(runtimeContext.testEnv, 'crm');
    const businessSession = await loginBusinessViaApi(
      businessData.authData,
      runtimeContext.testEnv,
    );
    const crmSession = await loginCrmViaApi(crmData.authData, runtimeContext.testEnv);

    try {
      expect(businessData.testData.order?.create).toBeTruthy();
      const createdOrder = await createBusinessOrderViaApi(
        businessSession,
        businessData.testData.order!.create,
      );
      const moderationResult = await moderateOrderViaApi(
        crmSession,
        createdOrder.orderId,
        createdOrder.requestPayload,
      );

      expect(moderationResult.status).toBe('moderated');
      expect(moderationResult.orderId).toBe(createdOrder.orderId);
    } finally {
      await disposeApiSession(businessSession);
      await disposeApiSession(crmSession);
    }
  });
});
