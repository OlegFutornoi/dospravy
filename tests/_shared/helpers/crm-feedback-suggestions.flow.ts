import { expect } from '@playwright/test';
import type { CrmFeedbackSuggestionsPage } from './crm-feedback-suggestions.page';

export type CrmFeedbackSuggestionDecision = 'confirm' | 'reject';

export interface ProcessedCrmFeedbackSuggestionResult {
  status: 'confirmed' | 'rejected';
  processedSignature: string;
  beforeCount: number;
  afterCount: number;
}

export async function processFirstFeedbackSuggestion(
  suggestionsPage: CrmFeedbackSuggestionsPage,
  decision: CrmFeedbackSuggestionDecision,
): Promise<ProcessedCrmFeedbackSuggestionResult> {
  await suggestionsPage.expectLoaded();
  await suggestionsPage.logCurrentSuggestionsList('Поточний список пропозицій перед вибором');
  const beforeCount = await suggestionsPage.expectSuggestionsCountAtLeast(1);

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

export function expectFeedbackSuggestionOutcome(
  result: ProcessedCrmFeedbackSuggestionResult,
  expectedStatus: 'confirmed' | 'rejected',
): void {
  expect(result.status).toBe(expectedStatus);
  expect(
    result.processedSignature,
    'Після обробки пропозиції має бути відомий текст картки, яку тест відкрив',
  ).toBeTruthy();
  expect(result.afterCount, 'Після обробки першої картки список має зменшитися').toBe(
    result.beforeCount - 1,
  );
}
