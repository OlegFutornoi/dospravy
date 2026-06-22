import { URLSearchParams } from 'node:url';
import { expect } from '@playwright/test';
import type { TestDataFile } from '../../../src/utils/data/load-test-data';
import { generateCrmCompanyData } from '../../_shared/factories/crm-company.factory';
import {
  buildCrmContractorData,
  generateCrmContractorData,
  type CrmContractorDataOverrides,
  type GeneratedCrmContractorData,
} from '../../_shared/factories/crm-contractor.factory';
import type { ApiSession } from './api-runtime';
import { findLookupIdByExactTitle, flattenLookupTree, type LookupOption } from './api-utils';

type CompanyCreateData = NonNullable<TestDataFile['company']>['create'];
type ContractorCreateData = NonNullable<TestDataFile['contractor']>['create'];

type PagedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type CategoryNode = {
  id: string;
  name: string;
  children: CategoryNode[];
};

export interface CreatedCrmCompanyApiResult {
  companyId: string;
  companyName: string;
}

export interface CreatedCrmContractorApiResult {
  contractorId: string;
  fullName: string;
}

export interface CreatedCrmContractorWithDataApiResult extends CreatedCrmContractorApiResult {
  contractor: GeneratedCrmContractorData;
}

export interface CrmCommentResult {
  commentId: string;
  contractorId: string;
}

export interface CrmModerationResult {
  status: 'moderated';
  orderId: string;
}

type CompanyListItem = {
  id: string;
  name: string;
};

export type ContractorListItem = {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  source: string;
  city_desired: string;
  categories: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
};

export interface CrmContractorListQuery {
  limit?: number;
  offset?: number;
  search?: string;
  lastActionType?: string;
  cityDesired?: string;
  source?: string;
}

type ContractorNote = {
  id: string;
  text: string;
};

function toApiPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('380')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+38${digits}`;
  }

  return `+380${digits}`;
}

function buildUniquePhone(prefix: string, digitsCount: number): string {
  const max = 10 ** digitsCount;
  const suffix = String(Math.floor(Math.random() * max)).padStart(digitsCount, '0');
  return `${prefix}${suffix}`;
}

export function mapContractorSourceToApi(source: string): string {
  const normalized = source.trim().toLowerCase();

  if (normalized === 'work.ua') {
    return 'workua';
  }

  if (normalized === 'вхідний дзвінок') {
    return 'incoming_call';
  }

  if (normalized === 'без джерела') {
    return 'no_source';
  }

  return normalized;
}

function mapContractorGenderToApi(gender: string): string {
  const normalized = gender.trim().toLowerCase();

  if (normalized === 'неважливо') {
    return 'any';
  }

  if (normalized === 'чоловіча') {
    return 'male';
  }

  if (normalized === 'жіноча') {
    return 'female';
  }

  return normalized;
}

async function getCrmCategories(session: ApiSession): Promise<LookupOption[]> {
  const response = await session.api.get('v1/categories/categories/');
  expect(response.ok(), 'CRM categories мають завантажуватися').toBeTruthy();
  const body = (await response.json()) as CategoryNode[];
  return flattenLookupTree(body);
}

export async function createCrmCompanyViaApi(
  session: ApiSession,
  companyCreateData: CompanyCreateData,
  seed = Date.now(),
): Promise<CreatedCrmCompanyApiResult> {
  const company = generateCrmCompanyData(companyCreateData, seed);
  const createResponse = await session.api.post('v1/companies/company/', {
    multipart: {
      name: company.companyName,
      description: company.description,
      security_name: company.securityContactName,
      security_contact: company.securityContactFormattedPhone,
      hr_moderation: 'false',
      shared_orders_access: 'false',
      contacts: JSON.stringify([
        {
          name: company.primaryHr.name,
          email: company.primaryHr.email,
          phone: toApiPhone(company.primaryHr.phone),
          supervisors: [
            {
              name: company.supervisor.name,
              email: company.supervisor.email,
              phone: toApiPhone(company.supervisor.phone),
            },
          ],
        },
        {
          name: company.secondaryHr.name,
          email: company.secondaryHr.email,
          phone: toApiPhone(company.secondaryHr.phone),
          supervisors: [],
        },
      ]),
    },
  });

  expect(createResponse.status(), 'Створення CRM company через API має повертати 201').toBe(201);
  const createdCompany = (await createResponse.json()) as { id: string; name: string };

  const listResponse = await session.api.get(
    'v1/companies/company/?limit=10&offset=0&ordering=-created_at',
  );
  expect(listResponse.ok(), 'Список компаній після створення має бути доступним').toBeTruthy();
  const listBody = (await listResponse.json()) as PagedResponse<CompanyListItem>;

  expect(
    listBody.results.some(
      (item) => item.id === createdCompany.id && item.name === company.companyName,
    ),
    'Нова компанія має з’явитися у верхній частині CRM списку',
  ).toBeTruthy();

  return {
    companyId: createdCompany.id,
    companyName: company.companyName,
  };
}

export async function createCrmContractorViaApi(
  session: ApiSession,
  contractorCreateData: ContractorCreateData,
  seed = Date.now(),
): Promise<CreatedCrmContractorApiResult> {
  const categories = await getCrmCategories(session);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const contractor = generateCrmContractorData(contractorCreateData, seed + attempt * 137);
    const createResponse = await session.api.post('v1/users/crm/contractors/', {
      data: {
        phone: toApiPhone(
          buildUniquePhone(
            contractorCreateData.phone.prefix,
            contractorCreateData.phone.digitsCount,
          ),
        ),
        has_viber: true,
        has_telegram: true,
        has_whatsapp: true,
        source: mapContractorSourceToApi(contractor.source),
        first_name: contractor.firstName,
        last_name: contractor.lastName,
        gender: mapContractorGenderToApi(contractor.gender),
        city_desired: contractor.city,
        categories: [findLookupIdByExactTitle(categories, contractor.specialization)],
        initial_note: contractor.comment,
      },
    });

    if (createResponse.status() === 400) {
      const errorBody = (await createResponse.json().catch(() => null)) as {
        phone?: { detail?: string };
      } | null;
      const duplicatePhone =
        typeof errorBody?.phone?.detail === 'string' &&
        errorBody.phone.detail.includes('already exists');

      if (duplicatePhone) {
        continue;
      }
    }

    const responseText = await createResponse.text();
    expect(
      createResponse.status(),
      `Створення CRM contractor через API має повертати 201. Відповідь: ${responseText}`,
    ).toBe(201);
    const createdContractor = JSON.parse(responseText) as { id: string };

    const searchResponse = await session.api.get(
      `v1/users/crm/contractors/?limit=20&offset=0&search=${encodeURIComponent(contractor.fullName)}&last_action_type=`,
    );
    expect(
      searchResponse.ok(),
      'Пошук контрактора після створення має бути доступним',
    ).toBeTruthy();
    const searchBody = (await searchResponse.json()) as PagedResponse<ContractorListItem>;

    expect(
      searchBody.results.some(
        (item) =>
          item.id === createdContractor.id &&
          item.first_name === contractor.firstName &&
          item.last_name === contractor.lastName,
      ),
      'Створений contractor має знаходитися у CRM пошуку',
    ).toBeTruthy();

    return {
      contractorId: createdContractor.id,
      fullName: contractor.fullName,
    };
  }

  throw new Error('Не вдалося створити CRM contractor через повторювані телефони після 5 спроб');
}

export async function createCrmContractorWithOverridesViaApi(
  session: ApiSession,
  contractorCreateData: ContractorCreateData,
  overrides: CrmContractorDataOverrides,
  seed = Date.now(),
): Promise<CreatedCrmContractorWithDataApiResult> {
  const categories = await getCrmCategories(session);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const contractor = buildCrmContractorData(
      contractorCreateData,
      overrides,
      seed + attempt * 137,
    );
    const createResponse = await session.api.post('v1/users/crm/contractors/', {
      data: {
        phone: toApiPhone(
          buildUniquePhone(
            contractorCreateData.phone.prefix,
            contractorCreateData.phone.digitsCount,
          ),
        ),
        has_viber: true,
        has_telegram: true,
        has_whatsapp: true,
        source: mapContractorSourceToApi(contractor.source),
        first_name: contractor.firstName,
        last_name: contractor.lastName,
        gender: mapContractorGenderToApi(contractor.gender),
        city_desired: contractor.city,
        categories: [findLookupIdByExactTitle(categories, contractor.specialization)],
        initial_note: contractor.comment,
      },
    });

    if (createResponse.status() === 400) {
      const errorBody = (await createResponse.json().catch(() => null)) as {
        phone?: { detail?: string };
      } | null;
      const duplicatePhone =
        typeof errorBody?.phone?.detail === 'string' &&
        errorBody.phone.detail.includes('already exists');

      if (duplicatePhone) {
        continue;
      }
    }

    const responseText = await createResponse.text();
    expect(
      createResponse.status(),
      `Створення CRM contractor через API має повертати 201. Відповідь: ${responseText}`,
    ).toBe(201);
    const createdContractor = JSON.parse(responseText) as { id: string };

    const searchBody = await listCrmContractorsViaApi(session, {
      search: contractor.lastName,
      limit: 20,
      offset: 0,
    });

    expect(
      searchBody.results.some(
        (item) =>
          item.id === createdContractor.id &&
          item.first_name === contractor.firstName &&
          item.last_name === contractor.lastName,
      ),
      'Створений contractor має знаходитися у CRM пошуку',
    ).toBeTruthy();

    return {
      contractorId: createdContractor.id,
      fullName: contractor.fullName,
      contractor,
    };
  }

  throw new Error('Не вдалося створити CRM contractor через повторювані телефони після 5 спроб');
}

export async function listCrmContractorsViaApi(
  session: ApiSession,
  query: CrmContractorListQuery = {},
): Promise<PagedResponse<ContractorListItem>> {
  const params = new URLSearchParams({
    limit: String(query.limit ?? 20),
    offset: String(query.offset ?? 0),
    last_action_type: query.lastActionType ?? '',
  });

  if (query.search) {
    params.set('search', query.search);
  }

  if (query.cityDesired) {
    params.set('city_desired', query.cityDesired);
  }

  if (query.source) {
    params.set('source', query.source);
  }

  const response = await session.api.get(`v1/users/crm/contractors/?${params.toString()}`);
  const responseText = await response.text();
  expect(
    response.ok(),
    `Список CRM contractors має бути доступним. Відповідь: ${responseText}`,
  ).toBeTruthy();
  return JSON.parse(responseText) as PagedResponse<ContractorListItem>;
}

export async function addAgentCommentToContractorViaApi(
  session: ApiSession,
  contractorId: string,
  commentText: string,
): Promise<CrmCommentResult> {
  const createResponse = await session.api.post(`v1/users/crm/contractors/${contractorId}/notes/`, {
    data: {
      text: commentText,
    },
  });

  expect(createResponse.status(), 'Створення comment для contractor має повертати 201').toBe(201);
  const createdComment = (await createResponse.json()) as ContractorNote;

  const listResponse = await session.api.get(`v1/users/crm/contractors/${contractorId}/notes/`);
  expect(listResponse.ok(), 'Список contractor notes має бути доступним').toBeTruthy();
  const notes = (await listResponse.json()) as ContractorNote[];

  expect(
    notes.some((note) => note.id === createdComment.id && note.text === commentText),
    'Новий коментар має з’явитися у списку нотаток контрактора',
  ).toBeTruthy();

  return {
    commentId: createdComment.id,
    contractorId,
  };
}

export function createCrmAgentCommentText(seed = Date.now()): string {
  return `Автотестовий API коментар агента ${seed} для перевірки стабільного збереження нового запису у списку коментарів.`;
}

export async function moderateOrderViaApi(
  crmSession: ApiSession,
  orderId: string,
  updatePayload: Record<string, unknown>,
): Promise<CrmModerationResult> {
  const patchResponse = await crmSession.api.patch(`v1/orders/external/${orderId}/`, {
    data: {
      ...updatePayload,
      is_open: true,
    },
  });
  const patchResponseText = await patchResponse.text();

  expect(
    patchResponse.ok(),
    `Перед модерацією замовлення має оновитися через PATCH з увімкненим публічним доступом. Відповідь: ${patchResponseText}`,
  ).toBeTruthy();

  const changeStatusResponse = await crmSession.api.post(
    `v1/orders/external/${orderId}/change-status/`,
    {
      data: {
        status: 'active',
      },
    },
  );

  expect(
    changeStatusResponse.ok(),
    'Модерація order через change-status має завершитися успішно',
  ).toBeTruthy();

  const detailsResponse = await crmSession.api.get(`v1/orders/order/${orderId}/`);
  const detailsResponseText = await detailsResponse.text();
  expect(
    detailsResponse.ok(),
    `Деталі order після модерації мають бути доступними. Відповідь: ${detailsResponseText}`,
  ).toBeTruthy();
  const detailsBody = JSON.parse(detailsResponseText) as {
    id: string;
    status?: string;
    is_open?: boolean;
  };

  expect(detailsBody.status, 'Після модерації статус ордера має стати active').toBe('active');
  expect(
    detailsBody.is_open,
    'Після модерації ордер має бути відкритим для публічного доступу',
  ).toBe(true);

  return {
    status: 'moderated',
    orderId: detailsBody.id,
  };
}
