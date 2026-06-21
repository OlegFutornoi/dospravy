# Покриті сценарії API regression

## Призначення

- Цей документ описує поточне `API` покриття в `tests/api`
- Основний порядок сценаріїв збережено таким самим, як у відповідних UI flow:
  `business -> crm`
- Джерелом для реалізації були реальні живі контракти з UI flow і вже потім допоміжно використовувався `swagger`

## Business API

### 1. Створення замовлення

- Файл smoke:
  `tests/api/business/smoke/order-create.api.smoke.spec.ts`
- Файл regression:
  `tests/api/business/regression/business.api.regression.spec.ts`
- Що перевіряється:
  - логін у business через API
  - завантаження актуальних lookup-даних з backend
  - складання payload на основі живих довідників і `testData.order.create`
  - створення нового замовлення через `POST /api/v1/orders/external/`
  - перевірка `orderId`, `formNumber` і дати роботи

## CRM API

### 2. Створення компанії

- Файл smoke:
  `tests/api/crm/smoke/company-create.api.smoke.spec.ts`
- Файл regression:
  `tests/api/crm/regression/crm.api.regression.spec.ts`
- Що перевіряється:
  - логін у CRM через API
  - створення компанії через `multipart/form-data`
  - форматування контактів і supervisor-ів у контракт, який реально використовує UI
  - перевірка `companyId` і `companyName`

### 3. Створення контрактора

- Файл smoke:
  `tests/api/crm/smoke/contractor-create.api.smoke.spec.ts`
- Файл regression:
  `tests/api/crm/regression/crm.api.regression.spec.ts`
- Що перевіряється:
  - логін у CRM через API
  - мапінг UI значень `source` і `gender` у API enum-и
  - генерація унікального телефону
  - створення нового контрактора
  - перевірка `contractorId` і `fullName`

### 4. Коментар агента в профілі контрактора

- Файл smoke:
  `tests/api/crm/smoke/contractor-agent-comment.api.smoke.spec.ts`
- Файл regression:
  `tests/api/crm/regression/crm.api.regression.spec.ts`
- Що перевіряється:
  - створення нового контрактора через API
  - додавання коментаря агента в `notes` endpoint
  - перевірка `commentId` і зв'язку з правильним `contractorId`

### 5. Коментар агента у сценарії колонки "Коментар"

- Файл smoke:
  `tests/api/crm/smoke/contractor-agent-comment-from-list.api.smoke.spec.ts`
- Файл regression:
  `tests/api/crm/regression/crm.api.regression.spec.ts`
- Що перевіряється:
  - окремий API test case для другого UI сценарію
  - створення нового контрактора
  - додавання коментаря в той самий `notes` endpoint, але як окремий сценарій покриття
  - перевірка `commentId` і `contractorId`

### 6. Модерація замовлення

- Файл smoke:
  `tests/api/crm/smoke/order-moderation.api.smoke.spec.ts`
- Файл regression:
  `tests/api/crm/regression/crm.api.regression.spec.ts`
- Що перевіряється:
  - логін у business через API
  - створення нового замовлення через business API
  - логін у CRM через API
  - оновлення замовлення через CRM API
  - зміна статусу й фінальна перевірка деталей через `v1/orders/order/{id}/`
  - перевірка фінального стану `moderated`

## Повний API regression

- Файл:
  `tests/api/full.api.regression.spec.ts`
- Порядок сценаріїв:
  1. `business` створює нове замовлення
  2. `crm` створює нову компанію
  3. `crm` створює нового контрактора
  4. `crm` додає коментар агента до нового контрактора
  5. `crm` додає коментар агента у сценарії колонки `Коментар`
  6. `crm` модерує щойно створене замовлення

## Поточний стан

- Реалізовано `6` smoke/regression сценаріїв по API
- Додано окремі entrypoint-и для:
  - `business` regression
  - `crm` regression
  - root `full API regression`
- Підтверджений успішний прогон:
  `APP_AREA=combined TEST_ENV=stage npx playwright test tests/api/full.api.regression.spec.ts`
