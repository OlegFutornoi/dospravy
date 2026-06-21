import { test, expect } from '@playwright/test';
import { loginCrmViaApi } from '../../_shared/api-auth';
import {
  addAgentCommentToContractorViaApi,
  createCrmAgentCommentText,
  createCrmContractorViaApi,
} from '../../_shared/crm.api';
import { disposeApiSession } from '../../_shared/api-runtime';
import { getRuntimeContext, loadCabinetAreaData } from '../../../../src/utils/data/load-test-data';

test('api smoke: crm додає коментар агента до нового контрактора', async () => {
  const runtimeContext = getRuntimeContext();
  const { authData, testData } = loadCabinetAreaData(runtimeContext.testEnv, 'crm');
  const session = await loginCrmViaApi(authData, runtimeContext.testEnv);

  try {
    expect(testData.contractor?.create).toBeTruthy();
    const createdContractor = await createCrmContractorViaApi(session, testData.contractor!.create);
    const commentText = createCrmAgentCommentText();
    const commentResult = await addAgentCommentToContractorViaApi(
      session,
      createdContractor.contractorId,
      commentText,
    );

    expect(commentResult.contractorId).toBe(createdContractor.contractorId);
    expect(commentResult.commentId).toBeTruthy();
  } finally {
    await disposeApiSession(session);
  }
});
