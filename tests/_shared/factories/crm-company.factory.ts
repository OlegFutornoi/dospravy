import type { TestDataFile } from '../../../src/utils/data/load-test-data';

export type CompanyCreateData = NonNullable<TestDataFile['company']>['create'];

export interface GeneratedCrmCompanyContact {
  name: string;
  email: string;
  phone: string;
  phoneDigits: string;
  formattedPhone: string;
}

export interface GeneratedCrmCompanyData {
  companyName: string;
  description: string;
  securityContactName: string;
  securityContactPhone: string;
  securityContactPhoneDigits: string;
  securityContactFormattedPhone: string;
  primaryHr: GeneratedCrmCompanyContact;
  secondaryHr: GeneratedCrmCompanyContact;
  supervisor: GeneratedCrmCompanyContact;
}

function pickBySeed(values: string[], seed: number): string {
  if (values.length === 0) {
    throw new Error('Для генерації компанії потрібен непорожній список значень');
  }

  return values[seed % values.length]!;
}

function buildPhone(prefix: string, digitsCount: number, seed: number): string {
  const suffix = String(seed % 10 ** digitsCount).padStart(digitsCount, '0');
  return `${prefix}${suffix}`;
}

function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? digits : `0${digits}`;
}

function formatPhone(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  return `+38 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}

function buildEmailLocalPart(prefix: string, role: string, seed: number): string {
  return `${prefix}.${role}.${seed.toString(36)}`;
}

function buildAlphabeticSuffix(seed: number, length = 4): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let value = Math.abs(seed);
  let result = '';

  for (let index = 0; index < length; index += 1) {
    result += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length);
  }

  return result;
}

function buildContact(
  params: {
    name: string;
    emailPrefix: string;
    role: string;
    domain: string;
    phonePrefix: string;
    phoneDigitsCount: number;
  },
  seed: number,
): GeneratedCrmCompanyContact {
  const phone = buildPhone(params.phonePrefix, params.phoneDigitsCount, seed);

  return {
    name: params.name,
    email: `${buildEmailLocalPart(params.emailPrefix, params.role, seed)}@${params.domain}`,
    phone,
    phoneDigits: normalizePhoneDigits(phone),
    formattedPhone: formatPhone(phone),
  };
}

export function generateCrmCompanyData(
  companyCreateData: CompanyCreateData,
  seed = Date.now(),
  attempt = 0,
): GeneratedCrmCompanyData {
  const effectiveSeed = seed + attempt * 101;
  const phonePrefix = companyCreateData.phone.prefix;
  const phoneDigitsCount = companyCreateData.phone.digitsCount;
  const emailDomain = companyCreateData.email.domain;

  const securityContactPhone = buildPhone(phonePrefix, phoneDigitsCount, effectiveSeed + 1);
  const primaryHr = buildContact(
    {
      name: pickBySeed(companyCreateData.hrNames, seed + 2),
      emailPrefix: pickBySeed(companyCreateData.email.localPrefixes, seed + 3),
      role: 'hr',
      domain: emailDomain,
      phonePrefix,
      phoneDigitsCount,
    },
    effectiveSeed + 4,
  );
  const secondaryHr = buildContact(
    {
      name: pickBySeed(companyCreateData.hrNames, seed + 5),
      emailPrefix: pickBySeed(companyCreateData.email.localPrefixes, seed + 6),
      role: 'hr2',
      domain: emailDomain,
      phonePrefix,
      phoneDigitsCount,
    },
    effectiveSeed + 7,
  );
  const supervisor = buildContact(
    {
      name: pickBySeed(companyCreateData.supervisorNames, seed + 8),
      emailPrefix: pickBySeed(companyCreateData.email.localPrefixes, seed + 9),
      role: 'supervisor',
      domain: emailDomain,
      phonePrefix,
      phoneDigitsCount,
    },
    effectiveSeed + 10,
  );

  return {
    companyName: `${pickBySeed(companyCreateData.companyNames, seed + 11)} ${buildAlphabeticSuffix(effectiveSeed + 11)}`,
    description: pickBySeed(companyCreateData.descriptions, seed + 12),
    securityContactName: pickBySeed(companyCreateData.securityContactNames, seed + 13),
    securityContactPhone,
    securityContactPhoneDigits: normalizePhoneDigits(securityContactPhone),
    securityContactFormattedPhone: formatPhone(securityContactPhone),
    primaryHr,
    secondaryHr,
    supervisor,
  };
}
