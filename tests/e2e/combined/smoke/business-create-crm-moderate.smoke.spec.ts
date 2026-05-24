import { expect, test } from '../../../_shared/fixtures/combined.fixture';
import { createAndModerateOrderAcrossCabinets } from '../../../_shared/helpers/combined/business-to-crm-order-lifecycle.flow';

test.describe('Смок: combined order lifecycle', () => {
  test.setTimeout(240_000);

  test('створює ордер у business і модерує його в crm', async ({
    page,
    runtimeContext,
    businessAuthData,
    businessTestData,
    crmAuthData,
    combinedFlowData,
  }) => {
    const lifecycle = await createAndModerateOrderAcrossCabinets(page, {
      businessAuthData,
      businessTestData,
      crmAuthData,
      combinedFlowData,
      testEnv: runtimeContext.testEnv,
    });

    expect(
      lifecycle.businessOrderNumber,
      'Потрібно зафіксувати номер створеного замовлення',
    ).toBeTruthy();
    expect(
      lifecycle.businessDraftOrderId,
      'Потрібно зафіксувати draft ID ордера в business',
    ).toBeTruthy();
    expect(
      lifecycle.queueIndex,
      'Для цього сценарію у CRM має бути відкритий перший ордер черги',
    ).toBe(0);
    expect(
      lifecycle.crmOrderLabel,
      'Потрібно зафіксувати order label відкритого CRM ордера',
    ).toContain('Order ');
    expect(
      lifecycle.moderationHttpStatus,
      'CRM moderation API повинно відповідати успішним HTTP статусом',
    ).toBeLessThan(400);
  });
});
