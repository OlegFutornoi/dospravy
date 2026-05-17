import { test, expect } from '../../../_shared/fixtures/business-cabinet.fixture';
import { BusinessOrderWizardPage } from '../../../_shared/helpers/business-order-wizard.page';

test.describe('Смок: створення замовлення', () => {
  test.setTimeout(120_000);

  test('створює замовлення через майстер', async ({ page, testData }) => {
    expect(
      testData.order?.create,
      'У data-файлі відсутні дані для створення замовлення: testData.order.create',
    ).toBeTruthy();

    const orderCreate = testData.order!.create;
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
    await wizard.submitOrder();

    await expect(page.getByText(/Замовлення №\s*[\d-]+\s+створено!/)).toBeVisible();
  });
});
