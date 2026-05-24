import { expect } from '@playwright/test';
import type { CrmOrdersPage } from './crm-orders.page';

export interface ModeratedOrderResult {
  status: 'moderated' | 'no_orders';
  orderId?: string;
  cardSignature?: string;
}

export async function moderateOrderWithPublicAccess(
  ordersPage: CrmOrdersPage,
  cardIndex = 0,
): Promise<ModeratedOrderResult> {
  await ordersPage.expectLoaded();

  if ((await ordersPage.getOrderCardsCount()) === 0) {
    ordersPage.logNoOrdersForModeration();
    return {
      status: 'no_orders',
    };
  }

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
    status: 'moderated',
    orderId,
    cardSignature,
  };
}

export function expectModerationOutcome(result: ModeratedOrderResult): void {
  expect(['moderated', 'no_orders']).toContain(result.status);

  if (result.status === 'moderated') {
    expect(result.orderId, 'Після модерації повинен бути відомий orderId').toBeTruthy();
  }
}
