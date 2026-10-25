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

Manual browser checks covered admin sign-in, make filtering, restocking, the receipt flow, and a disabled purchase button for zero stock. The October 24 redesign was reviewed in the browser with a disposable demo database: the new sign-in, admin stock desk and restock queue, buyer showroom and horizontal cards, a make filter narrowing nine vehicles to one sold-out listing, and a purchase receipt that reduced the demo vehicle's stock from five to four. The refreshed screenshots in `docs/screenshots/` show these rendered desktop states. The browser review did not include a narrow viewport; responsive layout rules were reviewed in the stylesheets. The API suite (10/10) and TypeScript/production build passed again after the redesign.

On **25 October 2026**, the header alignment and four-color blue palette were checked in the browser with a separate disposable database. Admin and buyer overviews, inventory rows, vehicle cards, the sold-out state, and a demo receipt were inspected. Screenshots were refreshed. The API suite passed 10/10; the TypeScript check and production build also passed after this visual change.

Reproduce the report with:

```bash
pnpm install --frozen-lockfile
pnpm exec vitest run --coverage
pnpm build
```
