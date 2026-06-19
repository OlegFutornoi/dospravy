import { expect } from '@playwright/test';
import type { CrmFeedbackSuggestionsPage } from './crm-feedback-suggestions.page';

export type CrmFeedbackSuggestionDecision = 'confirm' | 'reject';

export type CrmFeedbackSuggestionProcessStatus =
  | 'confirmed'
  | 'rejected'
  | 'no_suggestions'
  | 'not_enough_suggestions_for_reject';

export interface ProcessedCrmFeedbackSuggestionResult {
  status: CrmFeedbackSuggestionProcessStatus;
  processedSignature: string;
  beforeCount: number;
  afterCount: number;
}

async function processFirstFeedbackSuggestion(
  suggestionsPage: CrmFeedbackSuggestionsPage,
  decision: CrmFeedbackSuggestionDecision,
): Promise<ProcessedCrmFeedbackSuggestionResult> {
  const beforeCount = await suggestionsPage.getSuggestionsCount();
  await suggestionsPage.openSuggestionByIndex(0);
  const processedSignature = await suggestionsPage.currentActiveSuggestionSignature();

  if (decision === 'confirm') {
    await suggestionsPage.performActiveSuggestionDecision(0, 'підтвердження');
  } else {
    await suggestionsPage.performActiveSuggestionDecision(1, 'відмова');
  }

  await suggestionsPage.expectSuggestionMissingBySignature(processedSignature);
  const afterCount = await suggestionsPage.getSuggestionsCount();
  expect(afterCount, 'Після обробки першої картки список має зменшитися на 1').toBe(
    beforeCount - 1,
  );

  return {
    status: decision === 'confirm' ? 'confirmed' : 'rejected',
    processedSignature,
    beforeCount,
    afterCount,
  };
}

export async function processFirstFeedbackSuggestionIfAvailable(
  suggestionsPage: CrmFeedbackSuggestionsPage,
  decision: CrmFeedbackSuggestionDecision,
): Promise<ProcessedCrmFeedbackSuggestionResult> {
  await suggestionsPage.expectLoaded();
  await suggestionsPage.logCurrentSuggestionsList('Поточний список пропозицій перед вибором');
  const beforeCount = await suggestionsPage.getSuggestionsCount();

  if (beforeCount === 0) {
    console.log(
      '[E2E] На сторінці "Відгуки і пропозиції" немає карток для обробки, крок завершено без дії',
    );

    return {
      status: 'no_suggestions',
      processedSignature: '',
      beforeCount: 0,
      afterCount: 0,
    };
  }

  return processFirstFeedbackSuggestion(suggestionsPage, decision);
}

export async function processRejectSuggestionIfAvailable(
  suggestionsPage: CrmFeedbackSuggestionsPage,
  initialSuggestionsCount: number,
): Promise<ProcessedCrmFeedbackSuggestionResult> {
  await suggestionsPage.expectLoaded();
  await suggestionsPage.logCurrentSuggestionsList('Поточний список пропозицій перед відмовою');
  const beforeCount = await suggestionsPage.getSuggestionsCount();

  if (initialSuggestionsCount < 2 || beforeCount === 0) {
    console.log(
      `[E2E] Для кроку відмови недостатньо карток: initial=${initialSuggestionsCount}, current=${beforeCount}`,
    );

    return {
      status: 'not_enough_suggestions_for_reject',
      processedSignature: '',
      beforeCount,
      afterCount: beforeCount,
    };
  }

  return processFirstFeedbackSuggestion(suggestionsPage, 'reject');
}

export function expectFeedbackSuggestionOutcome(
  result: ProcessedCrmFeedbackSuggestionResult,
  expectedStatuses: CrmFeedbackSuggestionProcessStatus[],
): void {
  expect(
    expectedStatuses,
    'Статус обробки пропозиції не входить у дозволені для цього кроку',
  ).toContain(result.status);

  if (result.status === 'confirmed' || result.status === 'rejected') {
    expect(
      result.processedSignature,
      'Після обробки пропозиції має бути відомий текст картки, яку тест відкрив',
    ).toBeTruthy();
    expect(result.afterCount, 'Після обробки першої картки список має зменшитися').toBe(
      result.beforeCount - 1,
    );
    return;
  }

  expect(result.processedSignature).toBe('');
  expect(result.afterCount, 'Без доступних карток кількість не повинна змінюватися').toBe(
    result.beforeCount,
  );
}
