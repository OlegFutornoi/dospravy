# План API тестів

## Мета

Побудувати окремий API шар для тих самих позитивних бізнес-флоу, які вже покриті UI тестами, з тим самим логічним порядком:

1. `business` створення замовлення
2. `crm` створення компанії
3. `crm` створення контрактора
4. `crm` створення коментаря в профілі кандидата
5. `crm` створення коментаря через колонку `Коментар`
6. `crm` модерація замовлення

Для кожного успішного сценарію API тест спочатку виконує вхід у відповідний кабінет, а потім виконує цільову дію через HTTP API.

## Структура

- `tests/api/business/smoke`
- `tests/api/business/regression`
- `tests/api/business/docs`
- `tests/api/crm/smoke`
- `tests/api/crm/regression`
- `tests/api/crm/docs`
- `tests/api/docs`

## Спільні компоненти

- API fixtures для:
  - `runtimeContext`
  - `authData`
  - `testData`
  - `APIRequestContext`
- окремі auth helper-и:
  - `business` login / otp session bootstrap
  - `crm` email/password login
- окремі domain helper-и:
  - створення замовлення `business`
  - створення компанії `crm`
  - створення контрактора `crm`
  - створення коментаря кандидата `crm`
  - модерація замовлення `crm`
- окремі assertion/helper функції для перевірки успішних відповідей і витягання ID створених сутностей

## Набір тестів

### Business API

#### Smoke

1. `order-create.api.spec.ts`
   - логін у business
   - створення чернетки / замовлення через API
   - перевірка успішного HTTP статусу
   - перевірка наявності `draftOrderId` і номера замовлення

#### Regression

1. `business.api.regression.spec.ts`
   - запускає business API сценарії у serial порядку
   - на першому етапі містить лише успішне створення замовлення

### CRM API

#### Smoke

1. `company-create.api.spec.ts`
   - логін у CRM
   - створення компанії
   - перевірка ID та ключових полів відповіді

2. `contractor-create.api.spec.ts`
   - логін у CRM
   - створення кандидата
   - перевірка ID та ключових полів відповіді

3. `contractor-agent-comment.api.spec.ts`
   - логін у CRM
   - отримання першого кандидата
   - створення коментаря в профілі кандидата
   - перевірка, що коментар збережено

4. `contractor-agent-comment-from-list.api.spec.ts`
   - логін у CRM
   - отримання першого кандидата
   - створення коментаря для кандидата через той самий notes endpoint
   - окремий сценарій лишається окремим test case, щоб відповідати поточному UI порядку

5. `order-moderation.api.spec.ts`
   - логін у CRM
   - отримання доступного замовлення в черзі модерації
   - увімкнення `public_access`
   - підтвердження модерації
   - перевірка успішної відповіді та зміни стану

#### Regression

1. `crm.api.regression.spec.ts`
   - створення компанії
   - створення контрактора
   - коментар у профілі кандидата
   - коментар через список кандидатів
   - модерація замовлення

### Root API Regression

1. `tests/api/full.api.regression.spec.ts`
   - `business -> crm`
   - порядок:
     1. business order create
     2. crm company create
     3. crm contractor create
     4. crm contractor comment
     5. crm contractor comment from list
     6. crm order moderation

## Документація

Потрібно створити та підтримувати:

- `tests/api/business/docs/run-tests.md`
- `tests/api/business/docs/covered-scenarios.md`
- `tests/api/crm/docs/run-tests.md`
- `tests/api/crm/docs/covered-scenarios.md`
- `tests/api/docs/run-tests.md`
- `tests/api/docs/covered-scenarios.md`

## Порядок реалізації

1. Зафіксувати точні endpoint-и та payload-и через runtime capture існуючих UI flow.
2. Створити спільні API fixtures та auth helper-и.
3. Реалізувати business order create API smoke.
4. Реалізувати CRM company create API smoke.
5. Реалізувати CRM contractor create API smoke.
6. Реалізувати обидва CRM comment API smoke.
7. Реалізувати CRM moderation API smoke.
8. Зібрати CRM API regression.
9. Зібрати root full API regression.
10. Оновити docs.
11. Прогнати `npm run check` і цільові API suite-и.
