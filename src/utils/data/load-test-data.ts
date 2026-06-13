import fs from 'node:fs';
import path from 'node:path';

export type TestEnv = 'dev' | 'stage' | 'prod';
export type CabinetArea = 'business' | 'crm';
export type AppArea = CabinetArea | 'combined';

const ALLOWED_ENVS: TestEnv[] = ['dev', 'stage', 'prod'];
const ALLOWED_AREAS: AppArea[] = ['business', 'crm', 'combined'];
const CABINET_AREAS: CabinetArea[] = ['business', 'crm'];

export interface RuntimeContext {
  testEnv: TestEnv;
  appArea: AppArea;
}

export interface AuthDataFile {
  environment: TestEnv;
  area: CabinetArea;
  auth: {
    emailPassword: {
      email: string;
      password: string;
      rememberMe: boolean;
    };
    phoneOtp: {
      phone: string;
      otp: string;
      resendTimeoutSec: number;
    };
  };
}

export interface TestDataFile {
  environment: TestEnv;
  area: CabinetArea;
  users: {
    primary: {
      email: string;
      phone: string;
      firstName?: string;
      lastName?: string;
    };
    secondary: {
      email: string;
      phone: string;
      firstName?: string;
      lastName?: string;
    };
  };
  defaults: {
    otpCodeLength: number;
    countryCode: string;
  };
  jobPosting?: {
    create: {
      titlePrefix: string;
      description: string;
      city: string;
      address: string;
      hourlyRate: number;
      employeesNeeded: number;
    };
  };
  contractor?: {
    create: {
      firstNames: string[];
      lastNames: string[];
      sources: string[];
      genders: string[];
      cities: string[];
      specializations: string[];
      commentTemplates: string[];
      phone: {
        prefix: string;
        digitsCount: number;
      };
    };
  };
  order?: {
    create: {
      step2: {
        positionName: string;
        workDescription: string;
        perks: string[];
        gender: string;
        ageFrom: number;
        ageTo: number;
        candidateCategories: string[];
      };
      step3: {
        keyRequirements: string[];
        thingsToBring: string;
        requiredDocuments: string[];
        otherDocuments: string[];
        experience: string;
      };
      step4: {
        city: string;
        street: string;
        buildingNumber: string;
        riverBank: string;
        metro: string;
        district: string;
        landmarks: string;
        howToGetThere: string;
      };
      step5: {
        hourlyRate: number;
        shiftStart: string;
        shiftEnd: string;
        employeesCount: number;
      };
    };
  };
}

interface LoadedData {
  authData: AuthDataFile;
  testData: TestDataFile;
}

function isCabinetArea(value: string): value is CabinetArea {
  return CABINET_AREAS.includes(value as CabinetArea);
}

function ensureRecord(value: unknown, pathName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Некоректна структура даних у "${pathName}"`);
  }

  return value as Record<string, unknown>;
}

function ensureString(value: unknown, pathName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Поле "${pathName}" має бути непорожнім рядком`);
  }

  return value.trim();
}

function ensureNumber(value: unknown, pathName: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Поле "${pathName}" має бути числом`);
  }

  return value;
}

function ensureStringArray(value: unknown, pathName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Поле "${pathName}" має бути масивом`);
  }

  return value.map((item, index) => ensureString(item, `${pathName}[${index}]`));
}

function ensureNoPlaceholder(value: string, pathName: string): string {
  const normalized = value.trim();

  if (
    normalized === 'CHANGE_ME' ||
    normalized === '0000' ||
    normalized === '+380000000000' ||
    normalized.endsWith('@example.com')
  ) {
    throw new Error(`У data-файлі залишився шаблон замість реального значення: "${pathName}"`);
  }

  return normalized;
}

function ensureConfiguredWhenRequired(
  value: string,
  pathName: string,
  isRequired: boolean,
): string {
  return isRequired ? ensureNoPlaceholder(value, pathName) : value;
}

function validateAuthDataFile(data: unknown): AuthDataFile {
  const root = ensureRecord(data, 'auth.json');
  const auth = ensureRecord(root.auth, 'auth.json.auth');
  const emailPassword = ensureRecord(auth.emailPassword, 'auth.json.auth.emailPassword');
  const phoneOtp = ensureRecord(auth.phoneOtp, 'auth.json.auth.phoneOtp');
  const rawArea = ensureString(root.area, 'auth.json.area');
  if (!isCabinetArea(rawArea)) {
    throw new Error(`Поле "auth.json.area" має бути одним із: ${CABINET_AREAS.join(', ')}`);
  }
  const area = rawArea;
  const requiresPhoneOtpData = area === 'business';

  return {
    environment: ensureString(root.environment, 'auth.json.environment') as TestEnv,
    area,
    auth: {
      emailPassword: {
        email: ensureNoPlaceholder(
          ensureString(emailPassword.email, 'auth.json.auth.emailPassword.email'),
          'auth.json.auth.emailPassword.email',
        ),
        password: ensureNoPlaceholder(
          ensureString(emailPassword.password, 'auth.json.auth.emailPassword.password'),
          'auth.json.auth.emailPassword.password',
        ),
        rememberMe: Boolean(emailPassword.rememberMe),
      },
      phoneOtp: {
        phone: ensureConfiguredWhenRequired(
          ensureString(phoneOtp.phone, 'auth.json.auth.phoneOtp.phone'),
          'auth.json.auth.phoneOtp.phone',
          requiresPhoneOtpData,
        ),
        otp: ensureConfiguredWhenRequired(
          ensureString(phoneOtp.otp, 'auth.json.auth.phoneOtp.otp'),
          'auth.json.auth.phoneOtp.otp',
          requiresPhoneOtpData,
        ),
        resendTimeoutSec: ensureNumber(
          phoneOtp.resendTimeoutSec,
          'auth.json.auth.phoneOtp.resendTimeoutSec',
        ),
      },
    },
  };
}

function validateUserData(value: unknown, pathName: string): TestDataFile['users']['primary'] {
  const user = ensureRecord(value, pathName);

  return {
    email: ensureString(user.email, `${pathName}.email`),
    phone: ensureString(user.phone, `${pathName}.phone`),
    firstName:
      typeof user.firstName === 'string' && user.firstName.trim() !== ''
        ? user.firstName.trim()
        : undefined,
    lastName:
      typeof user.lastName === 'string' && user.lastName.trim() !== ''
        ? user.lastName.trim()
        : undefined,
  };
}

function validateJobPostingCreate(
  value: unknown,
  pathName: string,
): NonNullable<TestDataFile['jobPosting']>['create'] {
  const root = ensureRecord(value, pathName);

  return {
    titlePrefix: ensureString(root.titlePrefix, `${pathName}.titlePrefix`),
    description: ensureString(root.description, `${pathName}.description`),
    city: ensureString(root.city, `${pathName}.city`),
    address: ensureString(root.address, `${pathName}.address`),
    hourlyRate: ensureNumber(root.hourlyRate, `${pathName}.hourlyRate`),
    employeesNeeded: ensureNumber(root.employeesNeeded, `${pathName}.employeesNeeded`),
  };
}

function validateJobPosting(
  value: unknown,
  pathName: string,
): NonNullable<TestDataFile['jobPosting']> {
  const root = ensureRecord(value, pathName);

  return {
    create: validateJobPostingCreate(root.create, `${pathName}.create`),
  };
}

function validateContractorCreate(
  value: unknown,
  pathName: string,
): NonNullable<TestDataFile['contractor']>['create'] {
  const root = ensureRecord(value, pathName);
  const phone = ensureRecord(root.phone, `${pathName}.phone`);

  return {
    firstNames: ensureStringArray(root.firstNames, `${pathName}.firstNames`),
    lastNames: ensureStringArray(root.lastNames, `${pathName}.lastNames`),
    sources: ensureStringArray(root.sources, `${pathName}.sources`),
    genders: ensureStringArray(root.genders, `${pathName}.genders`),
    cities: ensureStringArray(root.cities, `${pathName}.cities`),
    specializations: ensureStringArray(root.specializations, `${pathName}.specializations`),
    commentTemplates: ensureStringArray(root.commentTemplates, `${pathName}.commentTemplates`),
    phone: {
      prefix: ensureString(phone.prefix, `${pathName}.phone.prefix`),
      digitsCount: ensureNumber(phone.digitsCount, `${pathName}.phone.digitsCount`),
    },
  };
}

function validateContractor(
  value: unknown,
  pathName: string,
): NonNullable<TestDataFile['contractor']> {
  const root = ensureRecord(value, pathName);

  return {
    create: validateContractorCreate(root.create, `${pathName}.create`),
  };
}

function validateOrderCreate(
  value: unknown,
  pathName: string,
): NonNullable<TestDataFile['order']>['create'] {
  const root = ensureRecord(value, pathName);
  const step2 = ensureRecord(root.step2, `${pathName}.step2`);
  const step3 = ensureRecord(root.step3, `${pathName}.step3`);
  const step4 = ensureRecord(root.step4, `${pathName}.step4`);
  const step5 = ensureRecord(root.step5, `${pathName}.step5`);

  return {
    step2: {
      positionName: ensureString(step2.positionName, `${pathName}.step2.positionName`),
      workDescription: ensureString(step2.workDescription, `${pathName}.step2.workDescription`),
      perks: ensureStringArray(step2.perks, `${pathName}.step2.perks`),
      gender: ensureString(step2.gender, `${pathName}.step2.gender`),
      ageFrom: ensureNumber(step2.ageFrom, `${pathName}.step2.ageFrom`),
      ageTo: ensureNumber(step2.ageTo, `${pathName}.step2.ageTo`),
      candidateCategories: ensureStringArray(
        step2.candidateCategories,
        `${pathName}.step2.candidateCategories`,
      ),
    },
    step3: {
      keyRequirements: ensureStringArray(
        step3.keyRequirements,
        `${pathName}.step3.keyRequirements`,
      ),
      thingsToBring: ensureString(step3.thingsToBring, `${pathName}.step3.thingsToBring`),
      requiredDocuments: ensureStringArray(
        step3.requiredDocuments,
        `${pathName}.step3.requiredDocuments`,
      ),
      otherDocuments: ensureStringArray(step3.otherDocuments, `${pathName}.step3.otherDocuments`),
      experience: ensureString(step3.experience, `${pathName}.step3.experience`),
    },
    step4: {
      city: ensureString(step4.city, `${pathName}.step4.city`),
      street: ensureString(step4.street, `${pathName}.step4.street`),
      buildingNumber: ensureString(step4.buildingNumber, `${pathName}.step4.buildingNumber`),
      riverBank: ensureString(step4.riverBank, `${pathName}.step4.riverBank`),
      metro: ensureString(step4.metro, `${pathName}.step4.metro`),
      district: ensureString(step4.district, `${pathName}.step4.district`),
      landmarks: ensureString(step4.landmarks, `${pathName}.step4.landmarks`),
      howToGetThere: ensureString(step4.howToGetThere, `${pathName}.step4.howToGetThere`),
    },
    step5: {
      hourlyRate: ensureNumber(step5.hourlyRate, `${pathName}.step5.hourlyRate`),
      shiftStart: ensureString(step5.shiftStart, `${pathName}.step5.shiftStart`),
      shiftEnd: ensureString(step5.shiftEnd, `${pathName}.step5.shiftEnd`),
      employeesCount: ensureNumber(step5.employeesCount, `${pathName}.step5.employeesCount`),
    },
  };
}

function validateOrder(value: unknown, pathName: string): NonNullable<TestDataFile['order']> {
  const root = ensureRecord(value, pathName);

  return {
    create: validateOrderCreate(root.create, `${pathName}.create`),
  };
}

function validateTestDataFile(data: unknown): TestDataFile {
  const root = ensureRecord(data, 'test-data.json');
  const users = ensureRecord(root.users, 'test-data.json.users');
  const defaults = ensureRecord(root.defaults, 'test-data.json.defaults');
  const jobPosting =
    root.jobPosting !== undefined
      ? validateJobPosting(root.jobPosting, 'test-data.json.jobPosting')
      : undefined;
  const contractor =
    root.contractor !== undefined
      ? validateContractor(root.contractor, 'test-data.json.contractor')
      : undefined;
  const order =
    root.order !== undefined ? validateOrder(root.order, 'test-data.json.order') : undefined;

  const rawArea = ensureString(root.area, 'test-data.json.area');
  if (!isCabinetArea(rawArea)) {
    throw new Error(`Поле "test-data.json.area" має бути одним із: ${CABINET_AREAS.join(', ')}`);
  }

  return {
    environment: ensureString(root.environment, 'test-data.json.environment') as TestEnv,
    area: rawArea,
    users: {
      primary: validateUserData(users.primary, 'test-data.json.users.primary'),
      secondary: validateUserData(users.secondary, 'test-data.json.users.secondary'),
    },
    defaults: {
      otpCodeLength: ensureNumber(defaults.otpCodeLength, 'test-data.json.defaults.otpCodeLength'),
      countryCode: ensureString(defaults.countryCode, 'test-data.json.defaults.countryCode'),
    },
    jobPosting,
    contractor,
    order,
  };
}

function isTestEnv(value: string): value is TestEnv {
  return ALLOWED_ENVS.includes(value as TestEnv);
}

function isAppArea(value: string): value is AppArea {
  return ALLOWED_AREAS.includes(value as AppArea);
}

export function getRuntimeContext(): RuntimeContext {
  const rawEnv = process.env.TEST_ENV ?? process.env.BUSINESS_ENV ?? 'stage';
  const rawArea = process.env.APP_AREA ?? 'business';

  if (!isTestEnv(rawEnv)) {
    throw new Error(`Invalid TEST_ENV: "${rawEnv}". Allowed: ${ALLOWED_ENVS.join(', ')}`);
  }

  if (!isAppArea(rawArea)) {
    throw new Error(`Invalid APP_AREA: "${rawArea}". Allowed: ${ALLOWED_AREAS.join(', ')}`);
  }

  return {
    testEnv: rawEnv,
    appArea: rawArea,
  };
}

function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }

  const file = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(file) as T;
}

export function loadCabinetAreaData(testEnv: TestEnv, appArea: CabinetArea): LoadedData {
  const baseDir = path.join(process.cwd(), 'data', testEnv, appArea);
  const authFilePath = path.join(baseDir, 'auth.json');
  const testDataFilePath = path.join(baseDir, 'test-data.json');
  const authData = validateAuthDataFile(readJson<unknown>(authFilePath));
  const testData = validateTestDataFile(readJson<unknown>(testDataFilePath));

  if (authData.environment !== testEnv || authData.area !== appArea) {
    throw new Error('Контекст запуску не збігається з даними у auth.json');
  }

  if (testData.environment !== testEnv || testData.area !== appArea) {
    throw new Error('Контекст запуску не збігається з даними у test-data.json');
  }

  return {
    authData,
    testData,
  };
}

export function loadAreaData(context: RuntimeContext): LoadedData {
  if (!isCabinetArea(context.appArea)) {
    throw new Error(
      'loadAreaData підтримує тільки business/crm. Для combined suite використовуйте окремий combined fixture',
    );
  }

  return loadCabinetAreaData(context.testEnv, context.appArea);
}
