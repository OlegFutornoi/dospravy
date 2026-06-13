# Як запускати тести crm

## Оточення

- `dev`: `APP_AREA=crm TEST_ENV=dev npx playwright test tests/e2e/crm --project=chromium`
- `stage`: `APP_AREA=crm TEST_ENV=stage npx playwright test tests/e2e/crm --project=chromium`
- `prod`: `APP_AREA=crm TEST_ENV=prod npx playwright test tests/e2e/crm --project=chromium`

## Запуск тільки crm login smoke

- `dev`:
  `APP_AREA=crm TEST_ENV=dev npx playwright test tests/e2e/crm/smoke/login.smoke.spec.ts --project=chromium`
- `stage`:
  `APP_AREA=crm TEST_ENV=stage npx playwright test tests/e2e/crm/smoke/login.smoke.spec.ts --project=chromium`
- `prod`:
  `APP_AREA=crm TEST_ENV=prod npx playwright test tests/e2e/crm/smoke/login.smoke.spec.ts --project=chromium`

## Запуск тільки crm moderation smoke

- `dev`:
  `APP_AREA=crm TEST_ENV=dev npx playwright test tests/e2e/crm/smoke/order-moderation.smoke.spec.ts --project=chromium`
- `stage`:
  `APP_AREA=crm TEST_ENV=stage npx playwright test tests/e2e/crm/smoke/order-moderation.smoke.spec.ts --project=chromium`
- `prod`:
  `APP_AREA=crm TEST_ENV=prod npx playwright test tests/e2e/crm/smoke/order-moderation.smoke.spec.ts --project=chromium`

## Запуск тільки crm contractor create smoke

- `dev`:
  `APP_AREA=crm TEST_ENV=dev npx playwright test tests/e2e/crm/smoke/contractor-create.smoke.spec.ts --project=chromium`
- `stage`:
  `APP_AREA=crm TEST_ENV=stage npx playwright test tests/e2e/crm/smoke/contractor-create.smoke.spec.ts --project=chromium`
- `prod`:
  `APP_AREA=crm TEST_ENV=prod npx playwright test tests/e2e/crm/smoke/contractor-create.smoke.spec.ts --project=chromium`

## Дані для запуску

- Дані логіну зберігаються в `data/<env>/crm/auth.json`
- Для зміни акаунта достатньо оновити `auth.emailPassword.email` і `auth.emailPassword.password`
- Перед запуском на `dev` або `prod` потрібно внести валідні дані в `data/dev/crm/auth.json` або `data/prod/crm/auth.json`
- Дані для створення контрактора зберігаються в `data/<env>/crm/test-data.json` у блоці `contractor.create`

## Архітектура orders

- Базовий helper для сторінки модерації замовлень лежить у `tests/_shared/helpers/crm-orders.page.ts`
- Reusable flow `Модерація` лежить у `tests/_shared/helpers/crm-order-moderation.flow.ts`
- Карта локаторів і знайдені ризики описані в `tests/e2e/crm/docs/orders-locators.md`
- Для нових flow-тестів по `orders` перевикористовувати helper, а не дублювати селектори в spec-файлах
- Якщо черга модерації порожня, smoke-тест логуватиме відсутність ордерів і завершуватиметься без падіння

## Перед запуском

- Перевірити актуальність даних у `data/<env>/crm/auth.json`
- Переконатись, що `npm run check` проходить без помилок
- Не використовувати статичні очікування в тестах
