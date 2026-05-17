# Як запускати тести business

## Оточення

- `dev`: `npm run test:dev -- --project=chromium`
- `stage`: `npm run test:stage -- --project=chromium`
- `prod`: `npm run test:prod -- --project=chromium`

## Запуск тільки business login smoke

- `dev`:
  `APP_AREA=business TEST_ENV=dev npx playwright test tests/e2e/business/smoke/login.smoke.spec.ts --project=chromium`
- `stage`:
  `APP_AREA=business TEST_ENV=stage npx playwright test tests/e2e/business/smoke/login.smoke.spec.ts --project=chromium`
- `prod`:
  `APP_AREA=business TEST_ENV=prod npx playwright test tests/e2e/business/smoke/login.smoke.spec.ts --project=chromium`

## Запуск тільки business order create smoke

- `dev`:
  `APP_AREA=business TEST_ENV=dev npx playwright test tests/e2e/business/smoke/order-create.smoke.spec.ts --project=chromium`
- `stage`:
  `APP_AREA=business TEST_ENV=stage npx playwright test tests/e2e/business/smoke/order-create.smoke.spec.ts --project=chromium`
- `prod`:
  `APP_AREA=business TEST_ENV=prod npx playwright test tests/e2e/business/smoke/order-create.smoke.spec.ts --project=chromium`

## Логи в консолі

- Тест створення замовлення логуює перехід між кроками майстра та фінальний стан `Замовлення № ... створено!`

## Запуск тільки business login regression

- `dev`:
  `APP_AREA=business TEST_ENV=dev npx playwright test tests/e2e/business/regression/login.regression.spec.ts --project=chromium`
- `stage`:
  `APP_AREA=business TEST_ENV=stage npx playwright test tests/e2e/business/regression/login.regression.spec.ts --project=chromium`
- `prod`:
  `APP_AREA=business TEST_ENV=prod npx playwright test tests/e2e/business/regression/login.regression.spec.ts --project=chromium`

## Запуск усього business e2e набору

- `dev`:
  `APP_AREA=business TEST_ENV=dev npx playwright test tests/e2e/business --project=chromium`
- `stage`:
  `APP_AREA=business TEST_ENV=stage npx playwright test tests/e2e/business --project=chromium`
- `prod`:
  `APP_AREA=business TEST_ENV=prod npx playwright test tests/e2e/business --project=chromium`

## Перед запуском

- Перевірити актуальність даних у `data/<env>/business/auth.json`
- Переконатись, що `npm run check` проходить без помилок
- Не використовувати статичні очікування в тестах
