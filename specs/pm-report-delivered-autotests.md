# PM Report: Виконані автотести по CRM та full regression

Репозиторій з тестами: [DoSpravi GitLab](https://gitlab.com/oleg.futornoi-group/DoSpravi.git)

## Що було зроблено

У межах задач зі скріну виконано 3 основні напрями:

1. `API` тести
2. Покриття коментарів автотестами
3. Автотести сторінки `activeOrders` і створення `full regression` проєкту

## 1. API тести

### Що реалізовано

- Додано окреме `API` покриття для CRM сценаріїв
- Побудовано CRM `API regression` набір
- Побудовано root `full API regression`, який об'єднує `business` і `crm`

### Які сценарії покрито

- створення компанії через `API`
- створення контрактора через `API`
- додавання коментаря агента до контрактора через `API`
- окремий `API` сценарій для кейсу колонки `Коментар`
- модерація замовлення через `API`

### Основні файли

- `tests/api/crm/smoke/company-create.api.smoke.spec.ts`
- `tests/api/crm/smoke/contractor-create.api.smoke.spec.ts`
- `tests/api/crm/smoke/contractor-agent-comment.api.smoke.spec.ts`
- `tests/api/crm/smoke/contractor-agent-comment-from-list.api.smoke.spec.ts`
- `tests/api/crm/smoke/order-moderation.api.smoke.spec.ts`
- `tests/api/crm/regression/crm.api.regression.spec.ts`
- `tests/api/full.api.regression.spec.ts`
- `tests/api/_shared/crm.api.ts`
- `tests/api/_shared/api-auth.ts`

## 2. Покрито коментарі автотестами

### Що реалізовано

- Покрито додавання коментаря агента в профілі кандидата
- Покрито сценарій додавання коментаря через колонку `Коментар` у списку кандидатів
- Для цього реалізовано і `UI`, і `API` рівень

### UI сценарії

- додавання нового коментаря агента в профілі першого кандидата
- додавання нового коментаря через колонку `Коментар` у списку кандидатів

### API сценарії

- додавання коментаря до нового контрактора через `notes` endpoint
- окремий `API` test case для сценарію колонки `Коментар`

### Основні файли

- `tests/e2e/crm/smoke/contractor-agent-comment.smoke.spec.ts`
- `tests/e2e/crm/smoke/contractor-agent-comment-from-list.smoke.spec.ts`
- `tests/_shared/helpers/crm-contractor-agent-comments.flow.ts`
- `tests/_shared/helpers/crm-contractors.page.ts`
- `tests/api/crm/smoke/contractor-agent-comment.api.smoke.spec.ts`
- `tests/api/crm/smoke/contractor-agent-comment-from-list.api.smoke.spec.ts`
- `tests/api/crm/regression/crm.api.regression.spec.ts`

## 3. Автотести сторінки `activeOrders`

### Що реалізовано

- Покрито сторінку `activeOrders` у CRM
- Перевірено дві ключові бізнес-дії:
  - підтвердження пропозиції
  - відмова по пропозиції
- Реалізовано page object і flow helper-и для стабільної роботи зі списком карток

### Які сценарії покрито

- підтвердження першої пропозиції на зміну
- відмова по наступній пропозиції на зміну
- перевірка, що картка зникає зі списку після дії
- перевірка зміни кількості карток у списку

### Основні файли

- `tests/e2e/crm/smoke/change-proposal-confirmation.smoke.spec.ts`
- `tests/_shared/helpers/crm-feedback-suggestions.page.ts`
- `tests/_shared/helpers/crm-feedback-suggestions.flow.ts`
- `tests/e2e/crm/regression/crm.regression.spec.ts`

## 4. Створено full regression проєкту

### Що реалізовано

- Зібрано кореневий `full regression` для `E2E`
- Зібрано кореневий `full API regression`
- Побудовано послідовний regression-флоу, який об'єднує `business`, `crm` і `combined` сценарії

### Що входить у full regression

- `business` login і базові негативні сценарії
- `business` create order
- `crm` login
- `crm` create company
- `crm` create contractor
- `crm` contractor comments
- `crm` activeOrders
- `combined` сценарій `business -> crm moderation`

### Основні файли

- `tests/e2e/full.regression.spec.ts`
- `tests/api/full.api.regression.spec.ts`
- `tests/e2e/crm/regression/crm.regression.spec.ts`
- `tests/api/crm/regression/crm.api.regression.spec.ts`
- `tests/e2e/docs/covered-scenarios.md`
- `tests/api/docs/covered-scenarios.md`

## Підсумок по результату

Фактично в межах цих задач було доставлено:

- `API` шар для CRM автотестів
- покриття коментарів на `UI` і `API`
- покриття сторінки `activeOrders`
- root `full regression` для `E2E`
- root `full API regression`

## Оцінка трудовитрат

### Реалістична оцінка по роботі

- `API` тести: `5-7` год
- покриття коментарів автотестами: `4-6` год
- автотести сторінки `activeOrders`: `5-7` год
- збирання і стабілізація `full regression` проєкту: `6-9` год
- документація, helper-и, інтеграція в regression і прогони: `4-6` год

### Коротко для PM

- На весь обсяг робіт розробник або automation QA витратив би приблизно `24-35 годин`
- Якщо рахувати повний цикл з дослідженням UI, побудовою helper-ів, smoke/regression сценаріями, root regression і документацією, оцінка `30-36 годин` є нормальною
