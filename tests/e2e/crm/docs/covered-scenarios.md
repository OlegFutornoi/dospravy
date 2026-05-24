# Покриті сценарії crm

## Smoke

### 1. Авторизує через email і пароль

Кроки:

1. Відкрити `/login`
2. Перевірити, що видно поля `Email`, `Пароль` і кнопку `Увійти`
3. Ввести валідний `email` з `data/<env>/crm/auth.json`
4. Ввести валідний `password` з `data/<env>/crm/auth.json`
5. Натиснути `Увійти`
6. Перевірити, що `POST /api/v1/users/login/` повернув `200`
7. Перевірити відкриття CRM кабінету

Файл:

- `tests/e2e/crm/smoke/login.smoke.spec.ts`
