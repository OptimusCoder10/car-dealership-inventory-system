import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['server/**/*.test.ts'], coverage: { include: ['server/**/*.ts'], exclude: ['server/**/*.test.ts', 'server/index.ts'] } },
});
