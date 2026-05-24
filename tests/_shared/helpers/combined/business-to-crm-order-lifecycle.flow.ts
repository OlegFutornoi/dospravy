import type { Page } from '@playwright/test';
import type { CombinedFlowDataFile } from '../../../../src/utils/data/load-combined-flow-data';
import type {
  AuthDataFile,
  TestDataFile,
  TestEnv,
} from '../../../../src/utils/data/load-test-data';
import { createBusinessOrderLifecycleSeed } from './business-order-create.flow';
import { locateOrderForModeration, moderateLocatedOrder } from './crm-order-moderation-search.flow';
import type { CombinedOrderLifecycleResult } from './order-lifecycle.types';

export async function createAndModerateOrderAcrossCabinets(
  page: Page,
  params: {
    businessAuthData: AuthDataFile;
    businessTestData: TestDataFile;
    crmAuthData: AuthDataFile;
    combinedFlowData: CombinedFlowDataFile;
    testEnv: TestEnv;
  },
): Promise<CombinedOrderLifecycleResult> {
  const createdOrder = await createBusinessOrderLifecycleSeed(
    page,
    params.businessAuthData,
    params.businessTestData,
    params.testEnv,
  );

  const { ordersPage, locatedOrder } = await locateOrderForModeration(
    page,
    params.crmAuthData,
    params.combinedFlowData,
    params.testEnv,
    createdOrder,
  );

  const moderatedOrder = await moderateLocatedOrder(page, ordersPage, locatedOrder);

  return {
    title: createdOrder.title,
    businessOrderNumber: createdOrder.businessOrderNumber,
    businessDraftOrderId: createdOrder.businessDraftOrderId,
    crmOrderLabel: locatedOrder.crmOrderLabel,
    queueIndex: locatedOrder.queueIndex,
    statusAfterCreate: locatedOrder.statusAfterCreate,
    statusBeforeModeration: locatedOrder.statusBeforeModeration,
    statusAfterModeration: moderatedOrder.statusAfterModeration,
    moderationHttpStatus: moderatedOrder.moderationHttpStatus,
    statusSourceUrl: moderatedOrder.statusSourceUrl,
  };
}
