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

## Запуск тільки crm company create smoke

- `dev`:
  `APP_AREA=crm TEST_ENV=dev npx playwright test tests/e2e/crm/smoke/company-create.smoke.spec.ts --project=chromium`
- `stage`:
  `APP_AREA=crm TEST_ENV=stage npx playwright test tests/e2e/crm/smoke/company-create.smoke.spec.ts --project=chromium`
- `prod`:
  `APP_AREA=crm TEST_ENV=prod npx playwright test tests/e2e/crm/smoke/company-create.smoke.spec.ts --project=chromium`

## Запуск crm regression набору

- `dev`:
  `APP_AREA=crm TEST_ENV=dev npx playwright test tests/e2e/crm/regression/crm.regression.spec.ts --project=chromium`
- `stage`:
  `APP_AREA=crm TEST_ENV=stage npx playwright test tests/e2e/crm/regression/crm.regression.spec.ts --project=chromium`
- `prod`:
  `APP_AREA=crm TEST_ENV=prod npx playwright test tests/e2e/crm/regression/crm.regression.spec.ts --project=chromium`
- Regression файл виконується послідовно і є точкою розширення для наступних CRM сценаріїв
- Поточний порядок сценаріїв: `login -> company create -> contractor create -> order moderation`

## Дані для запуску

- Дані логіну зберігаються в `data/<env>/crm/auth.json`
- Для зміни акаунта достатньо оновити `auth.emailPassword.email` і `auth.emailPassword.password`
- Перед запуском на `dev` або `prod` потрібно внести валідні дані в `data/dev/crm/auth.json` або `data/prod/crm/auth.json`
- Дані для створення контрактора зберігаються в `data/<env>/crm/test-data.json` у блоці `contractor.create`
- Дані для створення компанії зберігаються в `data/<env>/crm/test-data.json` у блоці `company.create`
- Для генерації імен та прізвищ використовуються тільки текстові значення з масивів `firstNames` і `lastNames`
- Для телефону використовується префікс з `contractor.create.phone.prefix`; у масковане поле тест вводить номер без стартового `0`, а в UI кандидат створюється з номером `077...`
- Для нових сценаріїв створення контрактора не додавати цифри або службові суфікси до ПІБ
- Для сценарію створення компанії email-и `HR` та супервайзера генеруються випадково, але завжди з доменом `gmail.com`
- Для сценарію створення компанії телефони генеруються з префіксом `033`, а назва компанії отримує унікальний буквений суфікс
- Якщо UI повертає дубль назви, email або телефону, smoke-тест робить повторну спробу з новими унікальними значеннями

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
