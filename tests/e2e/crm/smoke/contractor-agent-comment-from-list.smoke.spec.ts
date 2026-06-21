import { expect, test } from '../../../_shared/fixtures/app.fixture';
import { ensureCrmCabinetByEmailPassword } from '../../../_shared/helpers/crm-cabinet-auth.flow';
import {
  addAgentCommentThroughCommentColumnIfAvailable,
  createCrmAgentCommentText,
  expectCrmContractorAgentCommentOutcome,
} from '../../../_shared/helpers/crm-contractor-agent-comments.flow';
import { CrmContractorsPage } from '../../../_shared/helpers/crm-contractors.page';

test.describe('Смок: коментар агента через колонку коментарів crm', () => {
  test('додає новий коментар агента через колонку "Коментар" у списку кандидатів', async ({
    page,
    authData,
  }) => {
    await ensureCrmCabinetByEmailPassword(page, authData);

    const contractorsPage = new CrmContractorsPage(page);
    const commentText = createCrmAgentCommentText();
    const result = await addAgentCommentThroughCommentColumnIfAvailable(
      contractorsPage,
      commentText,
    );

    expectCrmContractorAgentCommentOutcome(result, ['comment_added', 'no_contractors']);
    expect(result.status).toBeDefined();
  });
});
