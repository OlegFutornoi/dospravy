> git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file -

> dospravy@1.0.0 precommit:check
> lint-staged && npm run typecheck

[STARTED] Backing up original state...
[COMPLETED] Backed up original state in git stash (575923c)
[STARTED] Running tasks for staged files...
[STARTED] package.json — 12 files
[STARTED] _.{ts,tsx} — 9 files
[STARTED] _.{json,md,yml,yaml} — 3 files
[STARTED] eslint --fix
[STARTED] prettier --write
[COMPLETED] prettier --write
[COMPLETED] \*.{json,md,yml,yaml} — 3 files
[FAILED] eslint --fix [FAILED]
[FAILED] eslint --fix [FAILED]
[COMPLETED] Running tasks for staged files...
[STARTED] Applying modifications from tasks...
[SKIPPED] Skipped because of errors from tasks.
[STARTED] Reverting to original state because of errors...
[COMPLETED] Reverting to original state because of errors...
[STARTED] Cleaning up temporary files...
[COMPLETED] Cleaning up temporary files...

✖ eslint --fix:

/Users/oleg/AQA/DoSpravy/tests/\_shared/helpers/crm-feedback-suggestions.flow.ts
35:5 error 'beforeCount' is not defined no-undef
41:5 error 'beforeCount' is not defined no-undef

/Users/oleg/AQA/DoSpravy/tests/e2e/crm/smoke/change-proposal-confirmation.smoke.spec.ts
1:10 error 'expect' is defined but never used @typescript-eslint/no-unused-vars
14:3 warning Test has no assertions playwright/expect-expect
28:3 warning Test has no assertions playwright/expect-expect

/Users/oleg/AQA/DoSpravy/tests/e2e/full.regression.spec.ts
239:3 warning Test has no assertions playwright/expect-expect
256:3 warning Test has no assertions playwright/expect-expect
262:5 warning Unexpected use of the `.skip()` annotation playwright/no-skipped-test

✖ 8 problems (3 errors, 5 warnings)
husky - pre-commit script failed (code 1)
