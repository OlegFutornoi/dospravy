import type { CrmOrdersPage } from './crm-orders.page';

export interface ModeratedOrderResult {
  orderId: string;
  cardSignature: string;
}

export async function moderateOrderWithPublicAccess(
  ordersPage: CrmOrdersPage,
  cardIndex = 0,
): Promise<ModeratedOrderResult> {
  await ordersPage.expectLoaded();
  await ordersPage.openOrderCardByIndex(cardIndex);

  const orderId = await ordersPage.currentOrderId();
  const cardSignature = await ordersPage.currentActiveCardSignature();

  await ordersPage.enablePublicAccess();
  await ordersPage.confirmModeration();
  await ordersPage.expectModerationSuccessMessages();
  await ordersPage.waitForOrdersReloaded();
  await ordersPage.expectOrderMissingBySignature(cardSignature);
  await ordersPage.expectNoActiveOrderSelected();

  return {
    orderId,
    cardSignature,
  };
}
