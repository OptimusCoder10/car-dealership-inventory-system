# Test report

Last verified on **25 October 2026** with Node.js 24.19.0 and Vitest 3.2.7.

| Check | Result |
| --- | --- |
| API test files | 3 passed |
| API tests | 11 passed, 0 failed |
| Statement coverage | 98.5% |
| Line coverage | 98.5% |
| Function coverage | 100% |
| Branch coverage | 75.29% |
| TypeScript check | Passed |
| Production frontend build | Passed |
| Frozen lockfile install | Passed |

The suite checks buyer registration and login, configured admin password changes across restart, input validation, duplicate email handling, admin permissions, multi-field search, atomic purchase of the final unit, restock/update/delete history, persistence across restart, and idempotent demo seeding. Branch coverage is lower than line coverage because some failure branches and transaction rollback paths are not exercised.

Manual browser checks covered admin sign-in, make filtering, restocking, the receipt flow, and a disabled purchase button for zero stock. The October 24 redesign was reviewed in the browser with a disposable demo database: the new sign-in, admin stock desk and restock queue, buyer showroom and horizontal cards, a make filter narrowing nine vehicles to one sold-out listing, and a purchase receipt that reduced the demo vehicle's stock from five to four. The refreshed screenshots in `docs/screenshots/` show these rendered desktop states. The browser review did not include a narrow viewport; responsive layout rules were reviewed in the stylesheets. The API suite (10/10) and TypeScript/production build passed again after the redesign.

On **25 October 2026**, the header alignment and four-color blue palette were checked in the browser with a separate disposable database. Admin and buyer overviews, inventory rows, vehicle cards, the sold-out state, and a demo receipt were inspected. Screenshots were refreshed. The API suite passed 10/10; the TypeScript check and production build also passed after this visual change.

On **25 October 2026**, a deployment readiness endpoint was added test first. Its initial test failed with HTTP 404, then passed after the database-backed endpoint was implemented. The full suite passed **11/11** across three files. Statement and line coverage were **98.5%**, function coverage **100%**, and branch coverage **75.29%**. TypeScript and the production frontend build passed.

The production Docker image built successfully with a frozen lockfile and production-only dependencies. A disposable container returned HTTP 200 for both `/` and `/api/health`; admin login and the nine seeded vehicles were confirmed after stopping and restarting it against the same mounted SQLite volume. No external hosting URL has been verified yet.

On **25 October 2026**, the buyer-only scroll story was checked in a running Vite preview at desktop and 390px phone widths. The collection, filters, and purchase actions remain before the animated section. The local photo loaded, its illustrative label and credit were visible, and the three steps and return link remained readable on the phone. The component also has a reduced-motion path that omits its transforms. The TypeScript check and production build passed; the API suite passed **11/11**. The first sandboxed test attempt could not bind to loopback (`EPERM`), so the passing run used local loopback permission.

Reproduce the report with:

```bash
pnpm install --frozen-lockfile
pnpm exec vitest run --coverage
pnpm build
```
