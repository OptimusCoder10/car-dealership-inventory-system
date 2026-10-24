import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, type AppContext } from './app';
import { seedDemoInventory } from './seed';

describe('demo inventory', () => {
  const directories: string[] = [];
  const contexts: AppContext[] = [];

  afterEach(() => {
    contexts.splice(0).forEach((context) => context.db.close());
    directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
  });

  function app(withAdmin: boolean) {
    const directory = mkdtempSync(join(tmpdir(), 'dealership-seed-'));
    directories.push(directory);
    const context = createApp({
      databasePath: join(directory, 'inventory.db'), jwtSecret: 'test-secret',
      admin: withAdmin ? { name: 'Inventory lead', email: 'admin@example.com', password: 'admin-password' } : undefined,
    });
    contexts.push(context);
    return context;
  }

  it('seeds representative inventory once, including a sold-out vehicle', () => {
    const { db } = app(true);
    expect(seedDemoInventory(db)).toBe(true);
    expect(seedDemoInventory(db)).toBe(false);
    expect((db.prepare('SELECT COUNT(*) AS count FROM vehicles').get() as { count: number }).count).toBe(9);
    expect((db.prepare('SELECT COUNT(*) AS count FROM stock_events').get() as { count: number }).count).toBe(9);
    expect((db.prepare('SELECT COUNT(*) AS count FROM vehicles WHERE quantity = 0').get() as { count: number }).count).toBe(1);
  });

  it('requires an administrator to own seeded stock events', () => {
    expect(() => seedDemoInventory(app(false).db)).toThrow('Set ADMIN_EMAIL');
  });
});
