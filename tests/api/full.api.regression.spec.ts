import { test, expect } from '@playwright/test';
import { loginBusinessViaApi, loginCrmViaApi } from './_shared/api-auth';
import { disposeApiSession } from './_shared/api-runtime';
import { createBusinessOrderViaApi } from './_shared/business-orders.api';
import {
  addAgentCommentToContractorViaApi,
  createCrmAgentCommentText,
  createCrmCompanyViaApi,
  createCrmContractorViaApi,
  moderateOrderViaApi,
} from './_shared/crm.api';
import { getRuntimeContext, loadCabinetAreaData } from '../../src/utils/data/load-test-data';

test.describe('Регресія: повний api прогон', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. api: business створює нове замовлення', async () => {
    const runtimeContext = getRuntimeContext();
    const { authData, testData } = loadCabinetAreaData(runtimeContext.testEnv, 'business');
    const session = await loginBusinessViaApi(authData, runtimeContext.testEnv);

    try {
      expect(testData.order?.create).toBeTruthy();
      const createdOrder = await createBusinessOrderViaApi(session, testData.order!.create);

      expect(createdOrder.orderId).toBeTruthy();
      expect(createdOrder.formNumber).toBeTruthy();
      expect(createdOrder.workDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    } finally {
      await disposeApiSession(session);
    }
  });

  test('2. api: crm створює нову компанію', async () => {
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

  test('3. api: crm створює нового контрактора', async () => {
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

  test('4. api: crm додає коментар агента до нового контрактора', async () => {
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

  test('5. api: crm додає коментар агента у сценарії колонки "Коментар"', async () => {
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

  test('6. api: crm модерує щойно створене замовлення', async () => {
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
