import { expect, type Page } from '@playwright/test';
import type { CompanyCreateData, GeneratedCrmCompanyData } from '../factories/crm-company.factory';
import { generateCrmCompanyData } from '../factories/crm-company.factory';
import { CrmCompaniesPage } from './crm-companies.page';

export async function createCompanyWithRetry(
  page: Page,
  companyCreateData: CompanyCreateData,
  seed = Date.now(),
  entryUrl = '/companies',
): Promise<GeneratedCrmCompanyData> {
  const companiesPage = new CrmCompaniesPage(page);
  let company = generateCrmCompanyData(companyCreateData, seed, 0);

  expect(company.primaryHr.phone, 'Телефон HR повинен починатися з 033').toMatch(/^033\d{7}$/);
  expect(company.secondaryHr.phone, 'Телефон другого HR повинен починатися з 033').toMatch(
    /^033\d{7}$/,
  );
  expect(company.supervisor.phone, 'Телефон супервайзера повинен починатися з 033').toMatch(
    /^033\d{7}$/,
  );
  expect(company.primaryHr.email, 'Email HR повинен використовувати gmail.com').toMatch(
    /^[a-z0-9.]+@gmail\.com$/i,
  );

  await companiesPage.goto(entryUrl);
  await companiesPage.openCreateCompanyForm();
  await companiesPage.fillCreateCompanyForm(company);

  const maxAttempts = 4;
  let lastValidationMessages: string[] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) {
      company = generateCrmCompanyData(companyCreateData, seed, attempt);
      await companiesPage.replaceRetryableChannels(company);
    }

    const submitResult = await companiesPage.submitCreateCompanyForm();

    if (submitResult.status === 'saved') {
      await companiesPage.expectCompanyVisibleInTable(company);
      return company;
    }

    lastValidationMessages = submitResult.messages;
    expect(
      companiesPage.isRetryableDuplicateValidation(submitResult.messages),
      `Очікувалась тільки retry-помилка на дубль назви/email/телефону, але отримано: ${submitResult.messages.join(
        ' | ',
      )}`,
    ).toBe(true);
  }

  throw new Error(
    `Компанію не вдалося зберегти після ${maxAttempts} спроб. Останні повідомлення: ${lastValidationMessages.join(
      ' | ',
    )}`,
  );
}
