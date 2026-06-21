# Як запускати API тести

## Smoke

- `business` smoke:
  `APP_AREA=business TEST_ENV=stage npx playwright test tests/api/business/smoke --project=chromium`
- `crm` smoke:
  `APP_AREA=crm TEST_ENV=stage npx playwright test tests/api/crm/smoke --project=chromium`

## Regression

- `business` regression:
  `APP_AREA=business TEST_ENV=stage npx playwright test tests/api/business/regression/business.api.regression.spec.ts --project=chromium`
- `crm` regression:
  `APP_AREA=crm TEST_ENV=stage npx playwright test tests/api/crm/regression/crm.api.regression.spec.ts --project=chromium`
- `full api regression`:
  `APP_AREA=combined TEST_ENV=stage npx playwright test tests/api/full.api.regression.spec.ts --project=chromium`

## Інші оточення

- `dev` full api regression:
  `APP_AREA=combined TEST_ENV=dev npx playwright test tests/api/full.api.regression.spec.ts --project=chromium`
- `stage` full api regression:
  `APP_AREA=combined TEST_ENV=stage npx playwright test tests/api/full.api.regression.spec.ts --project=chromium`
- `prod` full api regression:
  `APP_AREA=combined TEST_ENV=prod npx playwright test tests/api/full.api.regression.spec.ts --project=chromium`

## Перед запуском

- Перевірити актуальність даних у:
  `data/<env>/business/auth.json`
- Перевірити актуальність даних у:
  `data/<env>/business/test-data.json`
- Перевірити актуальність даних у:
  `data/<env>/crm/auth.json`
- Перевірити актуальність даних у:
  `data/<env>/crm/test-data.json`

## Остання перевірка

- `full API regression` на `stage` пройшов успішно:
  `6 passed`
- Команда останньої перевірки:
  `APP_AREA=combined TEST_ENV=stage npx playwright test tests/api/full.api.regression.spec.ts --project=chromium`
- Після додавання нових файлів також потрібно проганяти:
  `npm run check`

## Важливо

- `API` сценарії деструктивні: вони створюють нові сутності в `business` і `crm`
- Для `full API regression` використовується порядок:
  `business -> crm`
- `APP_AREA=combined` потрібен для кореневого full-файлу, навіть попри те, що самі API helper-и ходять у backend напряму
