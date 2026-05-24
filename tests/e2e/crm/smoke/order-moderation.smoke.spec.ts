import { expect, test } from '../../../_shared/fixtures/app.fixture';
import { ensureCrmCabinetByEmailPassword } from '../../../_shared/helpers/crm-cabinet-auth.flow';
import { moderateOrderWithPublicAccess } from '../../../_shared/helpers/crm-order-moderation.flow';
import { CrmOrdersPage } from '../../../_shared/helpers/crm-orders.page';

test.describe('Смок: модерація crm', () => {
  test('модерує замовлення через публічний доступ і підтвердження', async ({ page, authData }) => {
    await ensureCrmCabinetByEmailPassword(page, authData);

    const ordersPage = new CrmOrdersPage(page);
    await ordersPage.goto();

    const moderatedOrder = await moderateOrderWithPublicAccess(ordersPage);

    expect(moderatedOrder.orderId, 'Після модерації повинен бути відомий orderId').not.toBe('');
  });
});
