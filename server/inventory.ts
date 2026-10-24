import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Express, NextFunction, Request, Response } from 'express';
import { z } from 'zod';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;
type VehicleRow = {
  id: string; make: string; model: string; category: string; price: number; quantity: number;
  created_at: string; updated_at: string; deleted_at: string | null;
};
type StockEventRow = {
  id: string; vehicle_id: string; actor_id: string; type: string; delta: number;
  quantity_after: number; created_at: string;
};

const vehicleSchema = z.object({
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(60),
  price: z.number().int().positive().max(1000000000),
  quantity: z.number().int().nonnegative().max(100000),
});
const restockSchema = z.object({ quantity: z.number().int().positive().max(10000) });
const searchSchema = z.object({
  make: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  category: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
});

function problem(code: string, message: string) {
  return { error: { code, message } };
}

function vehicle(row: VehicleRow) {
  return {
    id: row.id, make: row.make, model: row.model, category: row.category,
    price: row.price, quantity: row.quantity, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function event(row: StockEventRow) {
  return {
    id: row.id, vehicleId: row.vehicle_id, actorId: row.actor_id, type: row.type,
    delta: row.delta, quantityAfter: row.quantity_after, createdAt: row.created_at,
  };
}

export function attachInventoryRoutes(app: Express, db: DatabaseSync, authenticate: Middleware) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY, make TEXT NOT NULL, model TEXT NOT NULL, category TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price > 0), quantity INTEGER NOT NULL CHECK (quantity >= 0),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS stock_events (
      id TEXT PRIMARY KEY, vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
      actor_id TEXT NOT NULL REFERENCES users(id), type TEXT NOT NULL,
      delta INTEGER NOT NULL, quantity_after INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_stock_events_vehicle ON stock_events(vehicle_id, created_at DESC);
  `);

  const adminOnly: Middleware = (_req, res, next) => {
    if (res.locals.user.role !== 'admin') return void res.status(403).json(problem('FORBIDDEN', 'Only an administrator can change inventory.'));
    next();
  };

  function findVehicle(id: string) {
    return db.prepare('SELECT * FROM vehicles WHERE id = ? AND deleted_at IS NULL').get(id) as VehicleRow | undefined;
  }

  function record(vehicleId: string, actorId: string, type: string, delta: number, quantityAfter: number) {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO stock_events (id, vehicle_id, actor_id, type, delta, quantity_after, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, vehicleId, actorId, type, delta, quantityAfter, createdAt);
    return { id, createdAt };
  }

  app.get('/api/vehicles', authenticate, (_req, res) => {
    const rows = db.prepare('SELECT * FROM vehicles WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC').all() as VehicleRow[];
    res.json({ vehicles: rows.map(vehicle) });
  });

  app.get('/api/vehicles/search', authenticate, (req, res) => {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success || (parsed.data.minPrice !== undefined && parsed.data.maxPrice !== undefined && parsed.data.minPrice > parsed.data.maxPrice)) {
      return res.status(400).json(problem('VALIDATION_ERROR', 'Check the search filters and price range.'));
    }
    const { make, model, category, minPrice, maxPrice } = parsed.data;
    const clauses = ['deleted_at IS NULL'];
    const params: (string | number)[] = [];
    for (const [column, value] of [['make', make], ['model', model], ['category', category]] as const) {
      if (value) { clauses.push(`${column} LIKE ? COLLATE NOCASE`); params.push(`%${value}%`); }
    }
    if (minPrice !== undefined) { clauses.push('price >= ?'); params.push(minPrice); }
    if (maxPrice !== undefined) { clauses.push('price <= ?'); params.push(maxPrice); }
    const rows = db.prepare(`SELECT * FROM vehicles WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC, id DESC`).all(...params) as VehicleRow[];
    return res.json({ vehicles: rows.map(vehicle) });
  });

  app.post('/api/vehicles', authenticate, adminOnly, (req, res) => {
    const parsed = vehicleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(problem('VALIDATION_ERROR', 'Enter valid vehicle details, a positive whole-number price, and nonnegative stock.'));
    const { make, model, category, price, quantity } = parsed.data;
    const id = randomUUID();
    const now = new Date().toISOString();
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('INSERT INTO vehicles (id, make, model, category, price, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, make, model, category, price, quantity, now, now);
      record(id, res.locals.user.id, 'initial', quantity, quantity);
      db.exec('COMMIT');
    } catch (cause) { db.exec('ROLLBACK'); throw cause; }
    return res.status(201).json({ vehicle: vehicle(findVehicle(id)!) });
  });

  app.put('/api/vehicles/:id', authenticate, adminOnly, (req, res) => {
    const parsed = vehicleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(problem('VALIDATION_ERROR', 'Enter complete, valid vehicle details.'));
    const previous = findVehicle(req.params.id as string);
    if (!previous) return res.status(404).json(problem('NOT_FOUND', 'Vehicle not found.'));
    const { make, model, category, price, quantity } = parsed.data;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('UPDATE vehicles SET make = ?, model = ?, category = ?, price = ?, quantity = ?, updated_at = ? WHERE id = ?')
        .run(make, model, category, price, quantity, new Date().toISOString(), previous.id);
      if (quantity !== previous.quantity) record(previous.id, res.locals.user.id, 'adjustment', quantity - previous.quantity, quantity);
      db.exec('COMMIT');
    } catch (cause) { db.exec('ROLLBACK'); throw cause; }
    return res.json({ vehicle: vehicle(findVehicle(previous.id)!) });
  });

  app.delete('/api/vehicles/:id', authenticate, adminOnly, (req, res) => {
    const result = db.prepare('UPDATE vehicles SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
      .run(new Date().toISOString(), new Date().toISOString(), req.params.id as string);
    if (!result.changes) return res.status(404).json(problem('NOT_FOUND', 'Vehicle not found.'));
    return res.status(204).send();
  });

  app.post('/api/vehicles/:id/purchase', authenticate, (req, res) => {
    const id = req.params.id as string;
    db.exec('BEGIN IMMEDIATE');
    try {
      const current = findVehicle(id);
      if (!current) { db.exec('ROLLBACK'); return res.status(404).json(problem('NOT_FOUND', 'Vehicle not found.')); }
      const result = db.prepare('UPDATE vehicles SET quantity = quantity - 1, updated_at = ? WHERE id = ? AND quantity > 0 AND deleted_at IS NULL')
        .run(new Date().toISOString(), id);
      if (!result.changes) { db.exec('ROLLBACK'); return res.status(409).json(problem('OUT_OF_STOCK', 'This vehicle is out of stock.')); }
      const remainingQuantity = current.quantity - 1;
      const receiptEvent = record(id, res.locals.user.id, 'purchase', -1, remainingQuantity);
      db.exec('COMMIT');
      return res.json({ receipt: { id: receiptEvent.id, vehicleId: id, quantity: 1, price: current.price, remainingQuantity, purchasedAt: receiptEvent.createdAt } });
    } catch (cause) { db.exec('ROLLBACK'); throw cause; }
  });

  app.post('/api/vehicles/:id/restock', authenticate, adminOnly, (req, res) => {
    const parsed = restockSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(problem('VALIDATION_ERROR', 'Enter a positive whole-number restock quantity.'));
    const id = req.params.id as string;
    db.exec('BEGIN IMMEDIATE');
    try {
      const current = findVehicle(id);
      if (!current) { db.exec('ROLLBACK'); return res.status(404).json(problem('NOT_FOUND', 'Vehicle not found.')); }
      const quantity = current.quantity + parsed.data.quantity;
      if (quantity > 100000) { db.exec('ROLLBACK'); return res.status(400).json(problem('VALIDATION_ERROR', 'Stock limit exceeded.')); }
      db.prepare('UPDATE vehicles SET quantity = ?, updated_at = ? WHERE id = ?').run(quantity, new Date().toISOString(), id);
      record(id, res.locals.user.id, 'restock', parsed.data.quantity, quantity);
      db.exec('COMMIT');
      return res.json({ vehicle: vehicle(findVehicle(id)!) });
    } catch (cause) { db.exec('ROLLBACK'); throw cause; }
  });

  app.get('/api/vehicles/:id/history', authenticate, adminOnly, (req, res) => {
    const exists = db.prepare('SELECT id FROM vehicles WHERE id = ?').get(req.params.id as string);
    if (!exists) return res.status(404).json(problem('NOT_FOUND', 'Vehicle not found.'));
    const rows = db.prepare('SELECT * FROM stock_events WHERE vehicle_id = ? ORDER BY created_at DESC, rowid DESC').all(req.params.id as string) as StockEventRow[];
    return res.json({ events: rows.map(event) });
  });
}
