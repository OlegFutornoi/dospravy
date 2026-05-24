import type { Page } from '@playwright/test';
import type {
  AuthDataFile,
  TestDataFile,
  TestEnv,
} from '../../../../src/utils/data/load-test-data';
import { ensureBusinessCabinetByPhoneOtp } from '../business-cabinet-auth.flow';
import { BusinessOrderWizardPage, type OrderCreateData } from '../business-order-wizard.page';
import { getAppBaseUrl } from './app-urls';
import type { CreatedOrderLifecycleSeed } from './order-lifecycle.types';

export async function createBusinessOrderLifecycleSeed(
  page: Page,
  authData: AuthDataFile,
  testData: TestDataFile,
  testEnv: TestEnv,
): Promise<CreatedOrderLifecycleSeed> {
  if (!testData.order?.create) {
    throw new Error('У data-файлі відсутні дані для створення замовлення: testData.order.create');
  }

  const orderCreate: OrderCreateData = testData.order.create;
  const businessBaseUrl = getAppBaseUrl('business', testEnv);
  await ensureBusinessCabinetByPhoneOtp(page, authData, `${businessBaseUrl}workspace`);

  const wizard = new BusinessOrderWizardPage(page);
  await wizard.goto();
  await wizard.waitForCompanyInfoLoaded();
  await wizard.goNext();

  await wizard.fillStep2OrderInfo(orderCreate);
  await wizard.goNext();

  await wizard.fillStep3Requirements(orderCreate);
  await wizard.goNext();

  await wizard.fillStep4WorkPlace(orderCreate);
  await wizard.goNext();

  await wizard.fillStep5Schedule(orderCreate);
  const createdOrder = await wizard.submitOrderAndCapture();

  console.log(
    `[E2E] Combined: створено ордер title="${orderCreate.step2.positionName}", businessOrderNumber="${createdOrder.businessOrderNumber}", draftOrderId="${createdOrder.businessDraftOrderId}" | path: /workspace/order`,
  );

  return {
    ...createdOrder,
    title: orderCreate.step2.positionName,
  };
}
