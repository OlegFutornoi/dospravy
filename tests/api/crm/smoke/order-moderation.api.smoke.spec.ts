import { test, expect } from '@playwright/test';
import { loginBusinessViaApi, loginCrmViaApi } from '../../_shared/api-auth';
import { createBusinessOrderViaApi } from '../../_shared/business-orders.api';
import { disposeApiSession } from '../../_shared/api-runtime';
import { moderateOrderViaApi } from '../../_shared/crm.api';
import { getRuntimeContext, loadCabinetAreaData } from '../../../../src/utils/data/load-test-data';

test('api smoke: crm модерує щойно створене замовлення', async () => {
  const runtimeContext = getRuntimeContext();
  const businessData = loadCabinetAreaData(runtimeContext.testEnv, 'business');
  const crmData = loadCabinetAreaData(runtimeContext.testEnv, 'crm');
  const businessSession = await loginBusinessViaApi(businessData.authData, runtimeContext.testEnv);
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
