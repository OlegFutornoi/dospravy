import type { Page } from '@playwright/test';
import type { AuthDataFile, TestEnv } from '../../../../src/utils/data/load-test-data';
import type { CombinedFlowDataFile } from '../../../../src/utils/data/load-combined-flow-data';
import { ensureCrmCabinetByEmailPassword } from '../crm-cabinet-auth.flow';
import { CrmOrdersPage } from '../crm-orders.page';
import { getAppBaseUrl } from './app-urls';
import {
  captureJsonApiResponsesWhile,
  findOrderStateInCapturedResponses,
} from './order-network.utils';
import type {
  CreatedOrderLifecycleSeed,
  LocatedModerationOrder,
  ModeratedOrderLifecycleResult,
} from './order-lifecycle.types';

export async function locateOrderForModeration(
  page: Page,
  authData: AuthDataFile,
  combinedFlowData: CombinedFlowDataFile,
  testEnv: TestEnv,
  createdOrder: CreatedOrderLifecycleSeed,
): Promise<{ ordersPage: CrmOrdersPage; locatedOrder: LocatedModerationOrder }> {
  const crmBaseUrl = getAppBaseUrl('crm', testEnv);

  await ensureCrmCabinetByEmailPassword(page, authData, crmBaseUrl);

  const ordersPage = new CrmOrdersPage(page);
  const maxReloadAttempts = combinedFlowData.flows.orderLifecycle.maxReloadAttempts;
  const appearanceTimeoutMs = combinedFlowData.flows.orderLifecycle.moderationAppearanceTimeoutMs;
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= maxReloadAttempts; attempt += 1) {
    if (Date.now() - startedAt > appearanceTimeoutMs) {
      break;
    }

    const { responses } = await captureJsonApiResponsesWhile(page, async () => {
      if (attempt === 1) {
        await ordersPage.openFromSidebar();
      } else {
        await page.goto(crmBaseUrl);
        await ordersPage.openFromSidebar();
      }
    });

    const visibleCardsCount = await ordersPage.getOrderCardsCount();
    if (visibleCardsCount === 0) {
      console.log(
        `[E2E] Combined: CRM queue поки порожня після створення ордера "${createdOrder.businessOrderNumber}", спроба ${attempt}/${maxReloadAttempts} | path: /orders`,
      );
      continue;
    }

    const openCapture = await captureJsonApiResponsesWhile(page, async () => {
      await ordersPage.openOrderCardByIndex(0);
    });
    const currentOrderLabel = await ordersPage.currentOrderLabel();
    const currentOrderId = await ordersPage.currentOrderId();
    const detailsMatch = findOrderStateInCapturedResponses(
      [...responses, ...openCapture.responses],
      [
        currentOrderLabel,
        currentOrderId,
        createdOrder.businessDraftOrderId,
        createdOrder.businessOrderNumber,
      ],
    );
    const statusBeforeModeration = detailsMatch?.status ?? 'невідомо';

    console.log(
      `[E2E] Combined: відкрито перший ордер у CRM, businessOrderNumber="${createdOrder.businessOrderNumber}", crmOrderLabel="${currentOrderLabel}", statusBeforeModeration="${statusBeforeModeration}" | path: /orders`,
    );

    return {
      ordersPage,
      locatedOrder: {
        queueIndex: 0,
        crmOrderLabel: currentOrderLabel,
        statusAfterCreate: statusBeforeModeration,
        statusBeforeModeration,
        apiState: {
          ...(detailsMatch ?? {
            sourceUrl: page.url(),
            responseStatus: 200,
            matchedNeedle: currentOrderLabel,
            rawMatch: {},
          }),
          id: detailsMatch?.id,
          status: statusBeforeModeration,
        },
      },
    };
  }

  throw new Error(
    `Не вдалося відкрити перший ордер у CRM moderation queue за ${maxReloadAttempts} спроб`,
  );
}

export async function moderateLocatedOrder(
  page: Page,
  ordersPage: CrmOrdersPage,
  locatedOrder: LocatedModerationOrder,
): Promise<ModeratedOrderLifecycleResult> {
  const cardSignature = await ordersPage.orderCardSignatureByIndex(locatedOrder.queueIndex);

  const { responses } = await captureJsonApiResponsesWhile(page, async () => {
    await ordersPage.enablePublicAccess();
    await ordersPage.confirmModeration();
    await ordersPage.expectModerationSuccessMessages();
    await ordersPage.waitForOrdersReloaded();
    try {
      await ordersPage.expectOrderMissingBySignature(cardSignature);
    } catch {
      console.log(
        `[E2E] Combined: після confirm картка ще видима, повторно перезавантажуємо /orders і перевіряємо чергу ще раз | path: /orders`,
      );
      await ordersPage.reloadOrdersPage();
      await ordersPage.expectOrderMissingBySignature(cardSignature);
    }
    await ordersPage.expectNoActiveOrderSelected();
  });
  const moderationMatch =
    findOrderStateInCapturedResponses(
      responses,
      [
        locatedOrder.crmOrderLabel,
        locatedOrder.apiState.id,
        locatedOrder.apiState.matchedNeedle,
      ].filter((value): value is string => Boolean(value && value.trim())),
    ) ?? null;
  const statusAfterModeration = moderationMatch?.status ?? 'невідомо';

  console.log(
    `[E2E] Combined: модерацію завершено, crmOrderLabel="${locatedOrder.crmOrderLabel}", statusBefore="${locatedOrder.statusBeforeModeration}", statusAfter="${statusAfterModeration}" | path: /orders`,
  );

  return {
    statusAfterModeration,
    moderationHttpStatus: moderationMatch?.responseStatus ?? 200,
    statusSourceUrl: moderationMatch?.sourceUrl ?? page.url(),
  };
}
