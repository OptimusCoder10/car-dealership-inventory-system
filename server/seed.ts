import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

const examples = [
  ['Tata', 'Nexon EV', 'Electric SUV', 1420000, 3],
  ['Mahindra', 'XUV700', 'SUV', 1890000, 2],
  ['Hyundai', 'Ioniq 5', 'Electric', 4590000, 1],
  ['Maruti Suzuki', 'Jimny', 'Adventure', 1280000, 4],
  ['Volkswagen', 'Virtus', 'Sedan', 1390000, 2],
  ['Kia', 'Seltos', 'SUV', 1560000, 0],
  ['MG', 'Comet EV', 'Electric', 890000, 5],
  ['Toyota', 'Innova Hycross', 'Family', 2250000, 2],
  ['Skoda', 'Slavia', 'Sedan', 1490000, 1],
] as const;

export function seedDemoInventory(db: DatabaseSync) {
  const count = db.prepare('SELECT COUNT(*) AS count FROM vehicles').get() as { count: number };
  if (count.count > 0) return false;
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY rowid LIMIT 1").get() as { id: string } | undefined;
  if (!admin) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding demo vehicles.');
  const insert = db.prepare('INSERT INTO vehicles (id, make, model, category, price, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertEvent = db.prepare('INSERT INTO stock_events (id, vehicle_id, actor_id, type, delta, quantity_after, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  db.exec('BEGIN IMMEDIATE');
  try {
    examples.forEach(([make, model, category, price, quantity], index) => {
      const id = randomUUID();
      const at = new Date(Date.now() - (examples.length - index) * 3600000).toISOString();
      insert.run(id, make, model, category, price, quantity, at, at);
      insertEvent.run(randomUUID(), id, admin.id, 'initial', quantity, quantity, at);
    });
    db.exec('COMMIT');
  } catch (cause) { db.exec('ROLLBACK'); throw cause; }
  return true;
}
