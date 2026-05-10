# Business Login Test Plan

## Scope

- Page under test: `https://business-staging.dospravy.com.ua/login`
- Product area: `business`
- Authentication methods:
  - Email + Password
  - Phone + OTP code
- Execution requirement: all scenarios must run on `dev`, `stage`, `prod`.

## Environments

- `dev`: `https://business-dev.dospravy.com.ua/`
- `stage`: `https://business-staging.dospravy.com.ua/`
- `prod`: `https://business.dospravy.com.ua/`

## Entry Criteria

- Test data exists in:
  - `data/dev/business/auth.json`
  - `data/stage/business/auth.json`
  - `data/prod/business/auth.json`
- Required fixture is used: `tests/_shared/fixtures/app.fixture.ts`.
- Runtime params are set:
  - `APP_AREA=business`
  - `TEST_ENV=dev|stage|prod`

## Test Suites

### 1. Smoke

#### 1.1 Login page loads

1. Open `/login`.
2. Verify page title and auth container are visible.
3. Verify both tabs are present: Email/Password and Phone.

#### 1.2 Successful login via Email + Password

1. Open `/login`.
2. Select Email/Password tab.
3. Enter valid email and password from `auth.emailPassword`.
4. Click "Увійти".
5. Verify successful redirect to authorized area.

#### 1.3 Successful login via Phone + OTP

1. Open `/login`.
2. Select Phone tab.
3. Enter valid phone from `auth.phoneOtp.phone`.
4. Request OTP code.
5. Enter valid OTP from `auth.phoneOtp.otp`.
6. Click "Увійти".
7. Verify successful redirect to authorized area.

### 2. Functional Validation

#### 2.1 Tab switching behavior

1. Switch between Email/Password and Phone tabs.
2. Verify active tab style changes correctly.
3. Verify relevant form fields are shown/hidden.

#### 2.2 Email field validation

1. Submit empty email with valid password.
2. Submit invalid email format.
3. Verify validation message and blocked submit.

#### 2.3 Password field validation

1. Submit empty password with valid email.
2. Verify validation message and blocked submit.
3. Verify password visibility toggle behavior if present.

#### 2.4 Phone field validation

1. Submit empty phone.
2. Submit short/invalid phone format.
3. Verify validation and blocked "Отримати код".

#### 2.5 OTP field validation

1. Open OTP step with valid phone.
2. Enter OTP shorter than required length.
3. Enter non-digit characters if UI allows input.
4. Verify submit is blocked until valid OTP length.

### 3. Negative Authorization

#### 3.1 Invalid email/password combination

1. Enter valid email and wrong password.
2. Submit.
3. Verify error message and stay on login flow.

#### 3.2 Unknown email account

1. Enter non-existing email and any password.
2. Submit.
3. Verify proper auth error handling.

#### 3.3 Invalid OTP code

1. Enter valid phone and request OTP.
2. Enter incorrect OTP.
3. Verify error message and no authorization.

#### 3.4 Expired OTP code

1. Request OTP and wait until expiration window.
2. Submit old code.
3. Verify expiration message and no authorization.

#### 3.5 OTP resend timer behavior

1. Request OTP.
2. Verify resend button/link disabled while timer runs.
3. Verify resend becomes available after timeout.

### 4. UX and State

#### 4.1 Enter key submit

1. Fill valid credentials.
2. Press Enter in password/OTP input.
3. Verify submit action behaves same as button click.

#### 4.2 Loading and button state

1. Trigger login request.
2. Verify button loading/disabled state.
3. Verify repeated clicks do not submit duplicate requests.

#### 4.3 Back from OTP to phone step

1. Open OTP step.
2. Click "Змінити номер телефону".
3. Verify return to phone input with expected state.

### 5. Security-Oriented Checks

#### 5.1 Sensitive data handling in UI

1. Enter password.
2. Verify password is masked by default.
3. Verify no sensitive value is shown in visible text errors.

#### 5.2 Brute-force basic behavior (safe check)

1. Perform several invalid login attempts.
2. Verify application returns stable responses and clear errors.
3. Verify no client-side crash and login form remains usable.

## Cross-Environment Execution Matrix

- For each scenario above, execute the same flow on:
  - `TEST_ENV=dev`
  - `TEST_ENV=stage`
  - `TEST_ENV=prod`
- Use the same test spec and fixtures; only data and baseURL are switched by env variables.

## Suggested Tagging

- Smoke:
  - 1.1, 1.2, 1.3
- Regression:
  - 2.x, 3.x, 4.x, 5.x

## Exit Criteria

- Smoke suite passes in all 3 environments.
- No critical/high defects in login flows.
- Regression failures triaged with clear defect tickets and logs/traces attached.
