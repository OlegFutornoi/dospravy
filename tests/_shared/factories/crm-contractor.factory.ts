import type { TestDataFile } from '../../../src/utils/data/load-test-data';

export type ContractorCreateData = NonNullable<TestDataFile['contractor']>['create'];

export interface GeneratedCrmContractorData {
  phone: string;
  phoneDigits: string;
  firstName: string;
  lastName: string;
  fullName: string;
  source: string;
  gender: string;
  city: string;
  specialization: string;
  comment: string;
}

function pickBySeed(values: string[], seed: number): string {
  if (values.length === 0) {
    throw new Error('Для генерації контрактора потрібен непорожній список значень');
  }

  return values[seed % values.length]!;
}

function buildPhone(prefix: string, digitsCount: number, seed: number): string {
  const suffix = String(seed % 10 ** digitsCount).padStart(digitsCount, '0');
  return `${prefix}${suffix}`;
}

export function generateCrmContractorData(
  contractorCreateData: ContractorCreateData,
  seed = Date.now(),
): GeneratedCrmContractorData {
  const baseFirstName = pickBySeed(contractorCreateData.firstNames, seed + 1);
  const baseLastName = pickBySeed(contractorCreateData.lastNames, seed + 2);
  const firstName = baseFirstName;
  const lastName = baseLastName;
  const phone = buildPhone(
    contractorCreateData.phone.prefix,
    contractorCreateData.phone.digitsCount,
    seed + 3,
  );

  return {
    phone,
    phoneDigits: `0${phone.replace(/\D/g, '')}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    source: pickBySeed(contractorCreateData.sources, seed + 4),
    gender: pickBySeed(contractorCreateData.genders, seed + 5),
    city: pickBySeed(contractorCreateData.cities, seed + 6),
    specialization: pickBySeed(contractorCreateData.specializations, seed + 7),
    comment: pickBySeed(contractorCreateData.commentTemplates, seed + 8),
  };
}
