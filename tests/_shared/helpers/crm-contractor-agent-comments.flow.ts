import { expect } from '@playwright/test';
import type { CrmContractorsPage } from './crm-contractors.page';

export type CrmContractorAgentCommentStatus = 'comment_added' | 'no_contractors';

export interface ProcessedCrmContractorAgentCommentResult {
  status: CrmContractorAgentCommentStatus;
  contractorSummary: string;
  commentText: string;
  beforeCount: number;
}

export function createCrmAgentCommentText(seed = Date.now()): string {
  return `Автотестовий коментар агента ${seed} для перевірки стабільного збереження нового запису у списку коментарів.`;
}

export async function addAgentCommentToFirstContractorIfAvailable(
  contractorsPage: CrmContractorsPage,
  commentText: string,
): Promise<ProcessedCrmContractorAgentCommentResult> {
  contractorsPage.logStep('Починаю сценарій додавання коментаря агента для кандидата');
  await contractorsPage.openFromSidebar();
  contractorsPage.logStep('Логую поточний список кандидатів перед вибором першого запису');
  await contractorsPage.logCurrentContractorsList('Поточний список кандидатів перед вибором');
  const beforeCount = await contractorsPage.getContractorsCount();
  contractorsPage.logStep(`На сторінці знайдено ${beforeCount} кандидатів для обробки`);

  if (beforeCount === 0) {
    console.log('[E2E] На сторінці "Кандидати" немає записів для додавання коментаря агента');

    return {
      status: 'no_contractors',
      contractorSummary: '',
      commentText,
      beforeCount: 0,
    };
  }

  contractorsPage.logStep('Відкриваю профіль першого кандидата зі списку');
  const contractorSummary = await contractorsPage.openFirstContractorDetails();
  contractorsPage.logStep('Відкриваю блок коментарів агентів у профілі кандидата');
  await contractorsPage.openAgentCommentsTab();
  contractorsPage.logStep('Додаю новий коментар агента і перевіряю його збереження');
  await contractorsPage.addAgentComment(commentText);
  contractorsPage.logStep('Сценарій додавання коментаря агента завершено успішно');

  return {
    status: 'comment_added',
    contractorSummary,
    commentText,
    beforeCount,
  };
}

export function expectCrmContractorAgentCommentOutcome(
  result: ProcessedCrmContractorAgentCommentResult,
  expectedStatuses: CrmContractorAgentCommentStatus[],
): void {
  expect(
    expectedStatuses,
    'Статус додавання коментаря агента не входить у дозволені для цього кроку',
  ).toContain(result.status);

  if (result.status === 'comment_added') {
    expect(
      result.contractorSummary,
      'Після відкриття профілю кандидата у логах має бути текст вибраного рядка',
    ).toBeTruthy();
    expect(
      result.commentText.length,
      'Новий коментар агента повинен бути довшим за 30 символів',
    ).toBeGreaterThan(30);
    return;
  }

  expect(result.contractorSummary).toBe('');
}
