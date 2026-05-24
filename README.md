# DoSpravy AQA

Автотестовий проєкт на `Playwright` + `TypeScript` для перевірки основних сценаріїв продукту `DoSpravy`.

Зараз у репозиторії є:

- `business` e2e тести для логіну та створення замовлення;
- `crm` e2e тести для логіну та модерації замовлень;
- `combined` e2e сценарії, які проходять флоу між двома кабінетами: створення ордера в `business` і модерація в `crm`.

## Що всередині

- `tests/e2e/business` - бізнес-сценарії кабінету `business`;
- `tests/e2e/crm` - сценарії кабінету `crm`;
- `tests/e2e/combined` - крос-кабінетні сценарії;
- `tests/_shared` - спільні fixture, page object та flow helper-и;
- `data/<env>/<area>` - тестові дані та креденшали для `dev`, `stage`, `prod`;
- `src/utils/data` - runtime loaders для data-файлів і контексту запуску;
- `specs` - тест-плани та чорнові специфікації сценаріїв.

## Як розгорнути

### 1. Встановити залежності

```bash
npm install
```

### 2. Встановити браузери Playwright

```bash
npx playwright install
```

### 3. Заповнити тестові дані

Перевірте і за потреби оновіть:

- `data/dev/business/auth.json`
- `data/stage/business/auth.json`
- `data/prod/business/auth.json`
- `data/dev/crm/auth.json`
- `data/stage/crm/auth.json`
- `data/prod/crm/auth.json`
- `data/<env>/business/test-data.json`
- `data/<env>/crm/test-data.json`
- `data/<env>/combined/test-data.json`

`combined` suite використовує дані одразу з `business` і `crm`, тому для нього обидва набори мають бути валідними.

### 4. Перевірити проєкт перед запуском

```bash
npm run check
```

## Як запускати

### Увесь business suite

```bash
npm run test:stage -- --project=chromium
```

### Увесь crm suite

```bash
npm run test:crm:stage -- --project=chromium
```

### Увесь combined suite

```bash
npm run test:combined:stage -- --project=chromium
```

### Запуск конкретного тесту

```bash
APP_AREA=combined TEST_ENV=stage npx playwright test tests/e2e/combined/smoke/business-create-crm-moderate.smoke.spec.ts --project=chromium
```

### Доступні оточення

- `dev`
- `stage`
- `prod`

Перемикання середовища відбувається через `APP_AREA` і `TEST_ENV`.

## Корисні команди

```bash
npm run check
npm run fix
npm run test:dev -- --project=chromium
npm run test:crm:dev -- --project=chromium
npm run test:combined:dev -- --project=chromium
```

## Де шукати інформацію по проєкту

### Запуск і покриття suite-ів

- `tests/e2e/business/docs/run-tests.md`
- `tests/e2e/business/docs/covered-scenarios.md`
- `tests/e2e/crm/docs/run-tests.md`
- `tests/e2e/crm/docs/covered-scenarios.md`
- `tests/e2e/crm/docs/orders-locators.md`
- `tests/e2e/combined/docs/run-tests.md`
- `tests/e2e/combined/docs/covered-scenarios.md`

### Тест-плани

- `specs/README.md`
- `specs/business-login-test-plan.md`
- `specs/business-order-create-test-plan.md`

### Базові helper-и та fixture

- `tests/_shared/fixtures/app.fixture.ts`
- `tests/_shared/fixtures/business-cabinet.fixture.ts`
- `tests/_shared/fixtures/combined.fixture.ts`
- `tests/_shared/helpers/business-order-wizard.page.ts`
- `tests/_shared/helpers/crm-orders.page.ts`
- `tests/_shared/helpers/combined/business-to-crm-order-lifecycle.flow.ts`

### Правила та підказки для розробки тестів

- `.trae/rules/rules.md`
- `.opencode/prompts/playwright-test-planner.md`

## Поточний стек

- `Playwright`
- `TypeScript`
- `ESLint`
- `Prettier`
- `Husky`

## Примітки

- Основний браузер у проєкті зараз `chromium`.
- Перед `push` спрацьовує `pre-push` перевірка через `npm run check`.
- Для уникнення зависання HTML report після падіння тестів можна запускати з `PLAYWRIGHT_HTML_OPEN=never`.
