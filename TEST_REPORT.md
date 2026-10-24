# Test report

Verified on **24 October 2026** with Node.js 24.19.0 and Vitest 3.2.7.

| Check | Result |
| --- | --- |
| API test files | 3 passed |
| API tests | 10 passed, 0 failed |
| Statement coverage | 98.47% |
| Line coverage | 98.47% |
| Function coverage | 100% |
| Branch coverage | 75% |
| TypeScript check | Passed |
| Production frontend build | Passed |
| Frozen lockfile install | Passed |

The suite checks buyer registration and login, configured admin password changes across restart, input validation, duplicate email handling, admin permissions, multi-field search, atomic purchase of the final unit, restock/update/delete history, persistence across restart, and idempotent demo seeding. Branch coverage is lower than line coverage because some failure branches and transaction rollback paths are not exercised.

Manual browser checks covered admin sign-in, make filtering, restocking, the receipt flow, and a disabled purchase button for zero stock. The October 24 UI refinement was reviewed in the browser with a disposable demo database: admin and buyer overviews, buyer registration, make filtering, stock and category cues, and the restock dialog. Screenshots in `docs/screenshots/` show the rendered interface. The API suite and production build passed again after the UI changes.

Reproduce the report with:

```bash
pnpm install --frozen-lockfile
pnpm exec vitest run --coverage
pnpm build
```
