import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, type AppContext } from './app';

describe('authentication', () => {
  let context: AppContext;
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'dealership-auth-'));
    context = createApp({ databasePath: join(directory, 'inventory.db'), jwtSecret: 'test-secret' });
  });

  afterEach(() => {
    context?.db.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it('registers a buyer, logs them in, and protects vehicle data', async () => {
    const anonymous = await request(context.app).get('/api/vehicles');
    expect(anonymous.status).toBe(401);

    const registered = await request(context.app).post('/api/auth/register').send({
      name: 'Avery Patel', email: 'avery@example.com', password: 'strong-password', role: 'admin',
    });
    expect(registered.status).toBe(201);
    expect(registered.body.user).toMatchObject({ name: 'Avery Patel', email: 'avery@example.com', role: 'buyer' });
    expect(registered.body.user).not.toHaveProperty('passwordHash');
    expect(registered.body.token).toEqual(expect.any(String));

    const listed = await request(context.app).get('/api/vehicles').set('Authorization', `Bearer ${registered.body.token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.vehicles).toEqual([]);

    const login = await request(context.app).post('/api/auth/login').send({ email: 'AVERY@example.com', password: 'strong-password' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('buyer');
  });

  it('rejects invalid registration and duplicate emails', async () => {
    const invalid = await request(context.app).post('/api/auth/register').send({
      name: 'A', email: 'not-an-email', password: 'short',
    });
    expect(invalid.status).toBe(400);

    const person = { name: 'Avery Patel', email: 'avery@example.com', password: 'strong-password' };
    expect((await request(context.app).post('/api/auth/register').send(person)).status).toBe(201);
    expect((await request(context.app).post('/api/auth/register').send({ ...person, email: 'AVERY@example.com' })).status).toBe(409);
    expect((await request(context.app).post('/api/auth/login').send({ email: person.email, password: 'wrong-password' })).status).toBe(401);
  });
});
