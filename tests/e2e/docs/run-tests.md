# Як запускати повний e2e regression

## Повний прогон усіх e2e тестів

- `dev`:
  `APP_AREA=combined TEST_ENV=dev npx playwright test tests/e2e/full.regression.spec.ts --project=chromium`
- `stage`:
  `APP_AREA=combined TEST_ENV=stage npx playwright test tests/e2e/full.regression.spec.ts --project=chromium`
- `prod`:
  `APP_AREA=combined TEST_ENV=prod npx playwright test tests/e2e/full.regression.spec.ts --project=chromium`

## Остання перевірка

- Останній повний прогін був успішно перевірений на `stage`
- Команда перевірки:
  `APP_AREA=combined TEST_ENV=stage npx playwright test tests/e2e/full.regression.spec.ts --project=chromium --reporter=list`
- Фактичний результат останнього прогона:
  `15 passed`
- Після фінальних правок також проходить:
  `npm run check`
- Після додавання сценарію `crm contractor agent comment` full regression містить `16` тестів і потребує наступного повного перепрогона для фіксації нового фінального результату

## Логіка порядку

- Full regression файл виконується послідовно і є єдиною точкою повного e2e прогону
- Поточний порядок suite-ів:
  `business -> crm -> combined`
- Усередині `business` спочатку йдуть базові login сценарії, потім негативні перевірки, відновлення пароля і створення замовлення
- Усередині `crm` спочатку йдуть login і CRUD сценарії, потім модерація, а наприкінці деструктивні сценарії `Відгуки і пропозиції`
- `combined` сценарій стоїть останнім, бо він залежить від обох кабінетів і змінює стан одразу в `business` та `crm`

## Що входить у full regression

- `business`:
  `login smoke + login regression + forgot password + order create`
- `crm`:
  `login + company create + contractor create + contractor agent comment + order moderation + change proposal confirm + change proposal reject`
- `combined`:
  `business create -> crm moderate`

## Важливо

- Для запуску повного regression потрібно використовувати `APP_AREA=combined`
- У цьому режимі базовий `baseURL` веде в `business`, а переходи в `crm` виконуються абсолютними URL
- Full regression є деструктивним: він створює нові сутності й обробляє реальні картки в CRM
- Перед повним прогоном на `stage` корисно підготувати дані, якщо в CRM бракує карток на модерацію або у `Відгуки і пропозиції`
- Для підготовки двох нових промодерованих замовлень можна двічі виконати:
  `APP_AREA=combined TEST_ENV=stage npx playwright test tests/e2e/combined/smoke/business-create-crm-moderate.smoke.spec.ts --project=chromium --reporter=list`
- Сценарій `business: створює замовлення через майстер` відкриває майстер зі стійким повторним переходом, якщо перший клік по меню не перевів зі списку `Замовлення`
- Сценарій `crm: додає новий коментар агента в профілі першого кандидата` відкриває `Кандидати` через sidebar, чекає ключові CRM API-запити і зберігає коментар у вкладці `Комент. агентів`
- Якщо на сторінці `Кандидати` немає записів, сценарій завершується без падіння з інформативним логом
- Сценарії `crm: Відгуки і пропозиції` тепер враховують реальну поведінку UI:
  підтвердження забирає картку одразу, а відмова потребує вибору причини і натискання `Зберегти`

## Перед запуском

- Перевірити актуальність даних у:
  `data/<env>/business/auth.json`
- Перевірити актуальність даних у:
  `data/<env>/crm/auth.json`
- Переконатись, що `npm run check` проходить без помилок
