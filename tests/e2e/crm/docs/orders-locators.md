# Карта локаторів crm orders

## Джерело

- Сторінку `https://crm-staging.dospravy.com.ua/orders` перевірено вручну через браузерні інструменти.
- Після логіну sidebar-пункт `Модерація замовлень` веде на `/orders`.
- Вибір іншої картки в лівому списку змінює `orderId` у правій панелі деталей.

## Структура сторінки

- Глобальний shell:
  - sidebar застосунку: `aside.ant-layout-sider`
  - основний контент: `main.ant-layout-content`
  - header сторінки: `.page-header`
  - заголовок сторінки: `getByRole('heading', { name: 'Модерація замовлень' })`
- Sidebar навігації:
  - меню-іконки мають стабільний атрибут `title`
  - рекомендований селектор: `aside [role="menuitem"][title="<назва>"]`
  - для `orders`: `aside [role="menuitem"][title="Модерація замовлень"]`
- Робоча зона orders:
  - wrapper сторінки: `.page-block.rounded.wrapper`
  - ліва колонка списку: `.page-sidebar`
  - права панель деталей: `.page-body`
  - форма деталей: `form.form-moderate-order`

## Список замовлень

- Пошук:
  - інпут не має label
  - базовий локатор: `getByPlaceholder('Пошук...')`
- Скрол-контейнер зі списком:
  - `.page-sidebar .sidebar-scroll`
- Картки:
  - загальний список: `.page-sidebar .card-order`
  - активна картка: `.page-sidebar .card-order.active`
  - заголовок картки: `.ant-card-head-title`
  - мета-дані картки: `.card-info`
- Практика для флоу:
  - якщо назва дублюється, не прив'язуватись лише до title
  - додатково фільтрувати по даті або іншому тексту картки

## Права панель деталей

- Action bar:
  - `Копіювати замовлення`: `getByRole('button', { name: 'Копіювати замовлення' })`
  - `Публічний доступ`: `getByLabel('Публічний доступ')`
  - `Зберегти`: `getByRole('button', { name: 'Зберегти' })`
  - `Підтвердити`: `getByRole('button', { name: 'Підтвердити' })`
- Іконкові кнопки:
  - попередня картка: перша `button.btn.btn-secondary` в action bar
  - наступна картка: друга `button.btn.btn-secondary` в action bar
  - кнопка призначення людей: `button.btn.btn--icon.btn--tooltip`
  - ризик: ці кнопки не мають видимого тексту, тому їх треба використовувати тільки в межах action bar helper-а
- Order summary:
  - блок зверху: `.page-block.blue`
  - текст `Order <id>`: `.text--xs`

## Поля форми

- Надійні `id`-локатори:
  - `#category`
  - `#short_description`
  - `#job_responsibilities`
  - `#age_from`
  - `#age_to`
  - `#addresses_0_city`
  - `#addresses_0_region`
  - `#addresses_0_street`
  - `#addresses_0_landmarks`
  - `#addresses_0_how_to_get`
  - `#hourly_rate`
  - `#rate_comments`
  - `#shifts_0_count_employees`
- Select-и:
  - `#gender`
  - `#proposed_candidates`
  - `#required_documents2`
  - `#addresses_0_coast`
  - `#addresses_0_subway`
  - `#rate_type`
- Кнопки секції змін:
  - `Додати зміну`
  - `Додати інтервал змін`
  - видалення зміни: `button.btn.btn--icon.btn--error`

## Ризики

- У блоці змін є дубльований `id="shifts_0_date_start"` для різних інпутів.
- Для полів дати й часу не варто спиратись лише на `id`.
- Безпечний підхід:
  - шукати inputs тільки в межах секції `Зміни`
  - працювати через порядок елементів або окремий helper для shift row
- Частина кнопок має лише SVG без тексту чи `aria-label`.
- Для них потрібні scope-локатори всередині action bar або shifts section, а не глобальні селектори по всій сторінці.
- Після успішної модерації список оновлюється без промодерованого ордера, але наступна картка автоматично не відкривається.
- Post-state після модерації:
  - `.card-order.active` відсутній
  - `form.form-moderate-order` відсутня
  - права панель залишається порожньою, доки не вибрати нову картку вручну

## Кодова база

- Locator map винесено в `tests/_shared/helpers/crm-orders.page.ts`
- Helper вже розділяє сторінку на:
  - shell
  - sidebar navigation
  - orders list
  - details form
  - action buttons
  - shifts
