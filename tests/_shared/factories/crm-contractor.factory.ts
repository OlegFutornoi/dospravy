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

export interface CrmContractorDataOverrides {
  phone?: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  gender?: string;
  city?: string;
  specialization?: string;
  comment?: string;
}

export interface CrmContractorFilterSeedSet {
  searchToken: string;
  cityA: string;
  cityB: string;
  sourceA: string;
  sourceB: string;
  contractors: [
    GeneratedCrmContractorData,
    GeneratedCrmContractorData,
    GeneratedCrmContractorData,
    GeneratedCrmContractorData,
  ];
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

export function buildAlphabeticToken(seed: number, minLength = 6): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let value = Math.abs(seed);
  let token = '';

  do {
    token = `${alphabet[value % alphabet.length]}${token}`;
    value = Math.floor(value / alphabet.length);
  } while (value > 0);

  while (token.length < minLength) {
    token = `A${token}`;
  }

  return token;
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

export function buildCrmContractorData(
  contractorCreateData: ContractorCreateData,
  overrides: CrmContractorDataOverrides = {},
  seed = Date.now(),
): GeneratedCrmContractorData {
  const generated = generateCrmContractorData(contractorCreateData, seed);
  const phone = overrides.phone ?? generated.phone;
  const firstName = overrides.firstName ?? generated.firstName;
  const lastName = overrides.lastName ?? generated.lastName;

  return {
    phone,
    phoneDigits: `0${phone.replace(/\D/g, '')}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    source: overrides.source ?? generated.source,
    gender: overrides.gender ?? generated.gender,
    city: overrides.city ?? generated.city,
    specialization: overrides.specialization ?? generated.specialization,
    comment: overrides.comment ?? generated.comment,
  };
}

export function buildCrmContractorFilterSeedSet(
  contractorCreateData: ContractorCreateData,
  seed = Date.now(),
): CrmContractorFilterSeedSet {
  if (contractorCreateData.cities.length < 2) {
    throw new Error(
      'Для фільтра по місту потрібні щонайменше 2 міста в testData.contractor.create',
    );
  }

  if (contractorCreateData.sources.length < 2) {
    throw new Error(
      'Для фільтра по джерелу потрібні щонайменше 2 джерела в testData.contractor.create',
    );
  }

  const searchToken = buildAlphabeticToken(seed);
  const cityA = contractorCreateData.cities[0]!;
  const cityB = contractorCreateData.cities[1]!;
  const sourceA = contractorCreateData.sources[0]!;
  const sourceB = contractorCreateData.sources[1]!;
  const specialization = contractorCreateData.specializations[0]!;
  const comment = `${contractorCreateData.commentTemplates[0]!} FILTER ${searchToken}`;
  const lastNameBase = `Фільтр${searchToken}`;
  const suffixes = ['А', 'Б', 'В', 'Г'] as const;

  return {
    searchToken,
    cityA,
    cityB,
    sourceA,
    sourceB,
    contractors: [
      buildCrmContractorData(
        contractorCreateData,
        {
          firstName: contractorCreateData.firstNames[0] ?? 'Артем',
          lastName: `${lastNameBase}${suffixes[0]}`,
          city: cityA,
          source: sourceA,
          specialization,
          comment,
        },
        seed + 11,
      ),
      buildCrmContractorData(
        contractorCreateData,
        {
          firstName: contractorCreateData.firstNames[1] ?? 'Олег',
          lastName: `${lastNameBase}${suffixes[1]}`,
          city: cityA,
          source: sourceB,
          specialization,
          comment,
        },
        seed + 22,
      ),
      buildCrmContractorData(
        contractorCreateData,
        {
          firstName: contractorCreateData.firstNames[2] ?? 'Ірина',
          lastName: `${lastNameBase}${suffixes[2]}`,
          city: cityB,
          source: sourceA,
          specialization,
          comment,
        },
        seed + 33,
      ),
      buildCrmContractorData(
        contractorCreateData,
        {
          firstName: contractorCreateData.firstNames[3] ?? 'Сергій',
          lastName: `${lastNameBase}${suffixes[3]}`,
          city: cityB,
          source: sourceB,
          specialization,
          comment,
        },
        seed + 44,
      ),
    ],
  };
}
