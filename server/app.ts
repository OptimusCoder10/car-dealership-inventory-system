import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { attachInventoryRoutes } from './inventory';

type Role = 'buyer' | 'admin';
type UserRow = { id: string; name: string; email: string; password_hash: string; role: Role };
type PublicUser = Omit<UserRow, 'password_hash'>;

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().transform((email) => email.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});
const loginSchema = z.object({
  email: z.email().transform((email) => email.trim().toLowerCase()),
  password: z.string().min(1),
});

function publicUser(row: UserRow): PublicUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

function error(code: string, message: string) {
  return { error: { code, message } };
}

export interface AppContext {
  app: ReturnType<typeof express>;
  db: DatabaseSync;
}

export function createApp(options: { databasePath: string; jwtSecret: string; admin?: { name: string; email: string; password: string } }): AppContext {
  const app = express();
  const db = new DatabaseSync(options.databasePath);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('buyer', 'admin'))
    );
  `);
  if (options.admin) {
    const adminEmail = options.admin.email.trim().toLowerCase();
    const existing = db.prepare('SELECT role FROM users WHERE email = ?').get(adminEmail) as { role: Role } | undefined;
    if (existing?.role === 'buyer') throw new Error('Admin email is already registered as a buyer');
    if (!existing) {
      db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
        .run(randomUUID(), options.admin.name, adminEmail, bcrypt.hashSync(options.admin.password, 12), 'admin');
    }
  }
  app.use(express.json());

  function issueToken(user: UserRow) {
    return jwt.sign({ sub: user.id }, options.jwtSecret, { expiresIn: '12h' });
  }

  function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    const match = /^Bearer (.+)$/.exec(req.header('Authorization') ?? '');
    if (!match) return res.status(401).json(error('UNAUTHENTICATED', 'Sign in to continue.'));
    try {
      const payload = jwt.verify(match[1], options.jwtSecret);
      if (typeof payload === 'string' || !payload.sub) throw new Error('Invalid token');
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as UserRow | undefined;
      if (!user) throw new Error('Unknown user');
      res.locals.user = publicUser(user);
      next();
    } catch {
      return res.status(401).json(error('UNAUTHENTICATED', 'Your session is no longer valid. Please sign in again.'));
    }
  }

  app.post('/api/auth/register', (req, res) => {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(error('VALIDATION_ERROR', 'Enter a name, valid email, and password of at least 8 characters.'));
    const { name, email, password } = parsed.data;
    const id = randomUUID();
    try {
      db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
        .run(id, name, email, bcrypt.hashSync(password, 12), 'buyer');
    } catch (cause) {
      if (cause instanceof Error && cause.message.includes('UNIQUE')) return res.status(409).json(error('EMAIL_TAKEN', 'An account with this email already exists.'));
      throw cause;
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
    return res.status(201).json({ user: publicUser(user), token: issueToken(user) });
  });

  app.post('/api/auth/login', (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(error('VALIDATION_ERROR', 'Enter a valid email and password.'));
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email) as UserRow | undefined;
    if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
      return res.status(401).json(error('INVALID_CREDENTIALS', 'Email or password is incorrect.'));
    }
    return res.json({ user: publicUser(user), token: issueToken(user) });
  });

  app.get('/api/auth/me', authenticate, (_req, res) => res.json({ user: res.locals.user }));
  attachInventoryRoutes(app, db, authenticate);

  return { app, db };
}
