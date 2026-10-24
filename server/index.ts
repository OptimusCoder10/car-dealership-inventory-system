import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import express from 'express';
import { createApp } from './app';
import { seedDemoInventory } from './seed';

if (existsSync('.env')) process.loadEnvFile('.env');

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 24) throw new Error('Set JWT_SECRET to a random value of at least 24 characters.');
const databasePath = process.env.DATABASE_PATH ?? join(process.cwd(), 'data', 'inventory.db');
mkdirSync(dirname(databasePath), { recursive: true });

const admin = process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD
  ? { name: process.env.ADMIN_NAME ?? 'Inventory lead', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }
  : undefined;
const { app, db } = createApp({ databasePath, jwtSecret: secret, admin });
if (process.env.SEED_DEMO === 'true') seedDemoInventory(db);

app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } }));
const dist = join(process.cwd(), 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/.*/, (_req, res) => res.sendFile(join(dist, 'index.html')));
}

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Inventory API listening on http://localhost:${port}`));

function stop() { db.close(); process.exit(0); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
