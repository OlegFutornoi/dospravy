import { expect } from '@playwright/test';
import type { TestDataFile } from '../../../src/utils/data/load-test-data';
import type { ApiSession } from './api-runtime';
import {
  buildOrderFormNumber,
  buildRandomFutureDateIso,
  findLookupIdByContains,
  findLookupIdByExactTitle,
  flattenLookupTree,
  type LookupOption,
} from './api-utils';

type BusinessOrderCreateData = NonNullable<TestDataFile['order']>['create'];

type BusinessCompanyExternalResponse = {
  company_name: string;
  company_description: string;
  company_id: string;
};

type BusinessRequiredDocument = {
  id: string;
  title: string;
  children: BusinessRequiredDocument[];
};

type BusinessCategoryNode = {
  id: string;
  name: string;
  children: BusinessCategoryNode[];
};

export interface CreatedBusinessOrderApiResult {
  orderId: string;
  formNumber: string;
  workDate: string;
  responseBody: Record<string, unknown>;
  requestPayload: Record<string, unknown>;
}

type CreatedBusinessOrderResponse = {
  id: string;
  form_number?: string;
};

function mapBusinessGenderToApi(gender: string): string {
  const normalized = gender.trim().toLowerCase();

  if (normalized === 'чоловіча') {
    return 'male';
  }

  if (normalized === 'жіноча') {
    return 'female';
  }

  if (normalized === 'неважливо') {
    return 'any';
  }

  return normalized;
}

async function getLookupOptions(
  session: ApiSession,
  path: string,
  rootField?: string,
): Promise<LookupOption[]> {
  const response = await session.api.get(path);
  expect(response.ok(), `Lookup "${path}" має повертати успішну відповідь`).toBeTruthy();
  const body = (await response.json()) as
    | { results?: Array<{ id: string; title: string }> }
    | Array<{ id: string; title: string }>;

  const source = Array.isArray(body)
    ? body
    : rootField === undefined
      ? (body.results ?? [])
      : ((body as Record<string, unknown>)[rootField] as Array<{ id: string; title: string }>);

  return source.map((item) => ({ id: item.id, title: item.title }));
}

async function getRequiredDocuments(session: ApiSession): Promise<LookupOption[]> {
  const response = await session.api.get('v1/orders/required-documents2/');
  expect(response.ok(), 'Список required documents має завантажуватися').toBeTruthy();
  const body = (await response.json()) as BusinessRequiredDocument[];
  return flattenLookupTree(body);
}

async function getCategories(session: ApiSession): Promise<LookupOption[]> {
  const response = await session.api.get('v1/categories/categories/');
  expect(response.ok(), 'Список категорій має завантажуватися').toBeTruthy();
  const body = (await response.json()) as BusinessCategoryNode[];
  return flattenLookupTree(body);
}

async function getCompanyExternal(session: ApiSession): Promise<BusinessCompanyExternalResponse> {
  const response = await session.api.get(`v1/companies/company/external/${session.userId}/`);
  expect(response.ok(), 'Профіль компанії contact person має завантажуватися').toBeTruthy();
  return (await response.json()) as BusinessCompanyExternalResponse;
}

export async function createBusinessOrderViaApi(
  session: ApiSession,
  orderCreateData: BusinessOrderCreateData,
): Promise<CreatedBusinessOrderApiResult> {
  const [
    companyExternal,
    orderAdvantages,
    proposedCandidates,
    requiredDocuments,
    experienceRequirements,
    keyRequirements,
    categories,
  ] = await Promise.all([
    getCompanyExternal(session),
    getLookupOptions(session, 'v1/orders/order-advantages/'),
    getLookupOptions(session, 'v1/orders/proposed-candidates/'),
    getRequiredDocuments(session),
    getLookupOptions(session, 'v1/orders/expirience-requirements/'),
    getLookupOptions(session, 'v1/orders/key-requirements/'),
    getCategories(session),
  ]);

  const workDate = buildRandomFutureDateIso(10);
  const formNumber = buildOrderFormNumber();
  const payload = {
    company_name: companyExternal.company_name,
    short_description: companyExternal.company_description,
    category: findLookupIdByContains(categories, orderCreateData.step2.positionName),
    job_responsibilities: orderCreateData.step2.workDescription,
    order_advantages: orderCreateData.step2.perks.map((item) =>
      findLookupIdByExactTitle(orderAdvantages, item),
    ),
    gender: mapBusinessGenderToApi(orderCreateData.step2.gender),
    age_from: orderCreateData.step2.ageFrom,
    age_to: orderCreateData.step2.ageTo,
    key_requirements: orderCreateData.step3.keyRequirements.map((item) =>
      findLookupIdByExactTitle(keyRequirements, item),
    ),
    required_equipment: orderCreateData.step3.thingsToBring,
    experience_requirements2: findLookupIdByExactTitle(
      experienceRequirements,
      orderCreateData.step3.experience,
    ),
    custom_experience_requirements: '',
    hourly_rate: orderCreateData.step5.hourlyRate,
    exclude_weekends: false,
    order_time: [
      {
        shift_period: [workDate, workDate],
        shifts: [
          {
            start: orderCreateData.step5.shiftStart,
            end: orderCreateData.step5.shiftEnd,
            amount: orderCreateData.step5.employeesCount,
          },
        ],
      },
    ],
    rate_comments: '',
    required_documents2: orderCreateData.step3.requiredDocuments.map((item) =>
      findLookupIdByExactTitle(requiredDocuments, item),
    ),
    proposed_candidates: orderCreateData.step2.candidateCategories.map((item) =>
      findLookupIdByExactTitle(proposedCandidates, item),
    ),
    addresses: [
      {
        city: orderCreateData.step4.city,
        subway: orderCreateData.step4.metro,
        coast: orderCreateData.step4.riverBank,
        postal_code: '08150',
        region: orderCreateData.step4.district,
        street: orderCreateData.step4.street,
        house_number: orderCreateData.step4.buildingNumber,
        landmarks: orderCreateData.step4.landmarks,
        latitude: '50.32154950',
        longitude: '30.29175770',
        how_to_get: orderCreateData.step4.howToGetThere,
        entrance: '',
        apartment: '',
      },
    ],
    client: companyExternal.company_id,
    form_number: formNumber,
  };

  const createResponse = await session.api.post('v1/orders/external/', {
    data: payload,
  });

  expect(createResponse.status(), 'Створення business order через API має повертати 201').toBe(201);
  const responseBody = (await createResponse.json()) as CreatedBusinessOrderResponse &
    Record<string, unknown>;

  expect(responseBody.id, 'Після створення order повинен бути id').toBeTruthy();

  return {
    orderId: responseBody.id,
    formNumber: String(responseBody.form_number ?? formNumber),
    workDate,
    responseBody,
    requestPayload: payload,
  };
}
