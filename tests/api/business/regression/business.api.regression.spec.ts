import { test, expect } from '@playwright/test';
import { loginBusinessViaApi } from '../../_shared/api-auth';
import { createBusinessOrderViaApi } from '../../_shared/business-orders.api';
import { disposeApiSession } from '../../_shared/api-runtime';
import { getRuntimeContext, loadCabinetAreaData } from '../../../../src/utils/data/load-test-data';

test('1. api: business створює нове замовлення', async () => {
  const runtimeContext = getRuntimeContext();
  const { authData, testData } = loadCabinetAreaData(runtimeContext.testEnv, 'business');
  const session = await loginBusinessViaApi(authData, runtimeContext.testEnv);

  try {
    expect(testData.order?.create).toBeTruthy();
    const createdOrder = await createBusinessOrderViaApi(session, testData.order!.create);

    expect(createdOrder.orderId).toBeTruthy();
    expect(createdOrder.formNumber).toBeTruthy();
  } finally {
    await disposeApiSession(session);
  }
});
