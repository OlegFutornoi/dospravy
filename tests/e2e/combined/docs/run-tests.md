# Combined E2E Tests

## Призначення

- `combined` suite покриває крос-кабінетні флоу між `business` і `crm`.
- Креденшали не дублюються: suite читає `data/<env>/business/*` і `data/<env>/crm/*`.
- Flow-специфічні налаштування лежать у `data/<env>/combined/test-data.json`.

## Запуск

```bash
APP_AREA=combined TEST_ENV=stage npx playwright test tests/e2e/combined --project=chromium
```

```bash
APP_AREA=combined TEST_ENV=stage npx playwright test tests/e2e/combined/smoke/business-create-crm-moderate.smoke.spec.ts --project=chromium
```

## Оточення

- `dev`: `APP_AREA=combined TEST_ENV=dev ...`
- `stage`: `APP_AREA=combined TEST_ENV=stage ...`
- `prod`: `APP_AREA=combined TEST_ENV=prod ...`

## Важливо

- `combined` suite стартує з base URL `business`, а перехід у `crm` робить абсолютними URL.
- Статуси lifecycle перевіряються не лише через UI, а й через мережеві JSON-відповіді.
- Якщо для нового сценарію потрібна зміна статусу через API, реалізацію додавати в окремий API helper, а не в page object.

## Перевірки перед завершенням

```bash
npm run check
```
