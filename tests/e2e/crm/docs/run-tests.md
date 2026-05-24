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

## Дані для запуску

- Дані логіну зберігаються в `data/<env>/crm/auth.json`
- Для зміни акаунта достатньо оновити `auth.emailPassword.email` і `auth.emailPassword.password`
- Перед запуском на `dev` або `prod` потрібно внести валідні дані в `data/dev/crm/auth.json` або `data/prod/crm/auth.json`

## Перед запуском

- Перевірити актуальність даних у `data/<env>/crm/auth.json`
- Переконатись, що `npm run check` проходить без помилок
- Не використовувати статичні очікування в тестах
