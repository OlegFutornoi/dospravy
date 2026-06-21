import { test, expect } from '@playwright/test';
import { loginBusinessViaApi } from '../../_shared/api-auth';
import { createBusinessOrderViaApi } from '../../_shared/business-orders.api';
import { disposeApiSession } from '../../_shared/api-runtime';
import { getRuntimeContext, loadCabinetAreaData } from '../../../../src/utils/data/load-test-data';

test('api smoke: business створює нове замовлення', async () => {
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
