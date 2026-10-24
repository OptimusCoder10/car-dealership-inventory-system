import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, type AppContext } from './app';

const car = { make: 'Tata', model: 'Nexon EV', category: 'Electric SUV', price: 1420000, quantity: 1 };

describe('vehicle inventory', () => {
  let context: AppContext;
  let directory: string;
  let adminToken: string;
  let buyerToken: string;

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'dealership-inventory-'));
    context = createApp({
      databasePath: join(directory, 'inventory.db'), jwtSecret: 'test-secret',
      admin: { name: 'Inventory lead', email: 'admin@example.com', password: 'admin-password' },
    });
    const admin = await request(context.app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'admin-password' });
    adminToken = admin.body.token;
    const buyer = await request(context.app).post('/api/auth/register').send({ name: 'Avery Patel', email: 'avery@example.com', password: 'buyer-password' });
    buyerToken = buyer.body.token;
  });

  afterEach(() => {
    context?.db.close();
    rmSync(directory, { recursive: true, force: true });
  });

  async function addVehicle(data = car) {
    return request(context.app).post('/api/vehicles').set('Authorization', `Bearer ${adminToken}`).send(data);
  }

  it('restricts inventory changes to administrators', async () => {
    expect((await addVehicle()).status).toBe(201);
    const vehicleId = (await request(context.app).get('/api/vehicles').set('Authorization', `Bearer ${buyerToken}`)).body.vehicles[0].id;
    expect((await request(context.app).post('/api/vehicles').set('Authorization', `Bearer ${buyerToken}`).send(car)).status).toBe(403);
    expect((await request(context.app).put(`/api/vehicles/${vehicleId}`).set('Authorization', `Bearer ${buyerToken}`).send(car)).status).toBe(403);
    expect((await request(context.app).delete(`/api/vehicles/${vehicleId}`).set('Authorization', `Bearer ${buyerToken}`)).status).toBe(403);
    expect((await request(context.app).post(`/api/vehicles/${vehicleId}/restock`).set('Authorization', `Bearer ${buyerToken}`).send({ quantity: 2 })).status).toBe(403);
  });

  it('validates vehicles and searches by make, model, category, and price', async () => {
    expect((await addVehicle({ ...car, quantity: -1 })).status).toBe(400);
    expect((await addVehicle()).status).toBe(201);
    expect((await addVehicle({ make: 'Hyundai', model: 'Creta', category: 'SUV', price: 1800000, quantity: 3 })).status).toBe(201);

    const queries = ['make=tata', 'model=NEXON', 'category=electric', 'minPrice=1400000&maxPrice=1500000'];
    for (const query of queries) {
      const response = await request(context.app).get(`/api/vehicles/search?${query}`).set('Authorization', `Bearer ${buyerToken}`);
      expect(response.status).toBe(200);
      expect(response.body.vehicles.map((vehicle: { model: string }) => vehicle.model)).toEqual(['Nexon EV']);
    }
    expect((await request(context.app).get('/api/vehicles/search?minPrice=foo').set('Authorization', `Bearer ${buyerToken}`)).status).toBe(400);
  });

  it('sells the final unit only once and records a receipt', async () => {
    const added = await addVehicle();
    const id = added.body.vehicle.id;
    const purchases = await Promise.all([
      request(context.app).post(`/api/vehicles/${id}/purchase`).set('Authorization', `Bearer ${buyerToken}`),
      request(context.app).post(`/api/vehicles/${id}/purchase`).set('Authorization', `Bearer ${buyerToken}`),
    ]);
    expect(purchases.map((response) => response.status).sort()).toEqual([200, 409]);
    const success = purchases.find((response) => response.status === 200)!;
    expect(success.body.receipt).toMatchObject({ vehicleId: id, quantity: 1, remainingQuantity: 0 });
    const listed = await request(context.app).get('/api/vehicles').set('Authorization', `Bearer ${buyerToken}`);
    expect(listed.body.vehicles[0].quantity).toBe(0);
  });

  it('restocks, updates, and removes a vehicle while retaining stock history', async () => {
    const added = await addVehicle();
    const id = added.body.vehicle.id;
    const restock = await request(context.app).post(`/api/vehicles/${id}/restock`).set('Authorization', `Bearer ${adminToken}`).send({ quantity: 2 });
    expect(restock.status).toBe(200);
    expect(restock.body.vehicle.quantity).toBe(3);

    const updated = await request(context.app).put(`/api/vehicles/${id}`).set('Authorization', `Bearer ${adminToken}`).send({ ...car, model: 'Nexon EV Max', quantity: 4 });
    expect(updated.status).toBe(200);
    expect(updated.body.vehicle).toMatchObject({ model: 'Nexon EV Max', quantity: 4 });

    const history = await request(context.app).get(`/api/vehicles/${id}/history`).set('Authorization', `Bearer ${adminToken}`);
    expect(history.status).toBe(200);
    expect(history.body.events.map((event: { type: string }) => event.type)).toEqual(['adjustment', 'restock', 'initial']);

    expect((await request(context.app).delete(`/api/vehicles/${id}`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(204);
    const listed = await request(context.app).get('/api/vehicles').set('Authorization', `Bearer ${buyerToken}`);
    expect(listed.body.vehicles).toEqual([]);
  });

  it('persists inventory across application restarts', async () => {
    const id = (await addVehicle()).body.vehicle.id;
    context.db.close();
    context = createApp({ databasePath: join(directory, 'inventory.db'), jwtSecret: 'test-secret' });
    const listed = await request(context.app).get('/api/vehicles').set('Authorization', `Bearer ${buyerToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body.vehicles[0].id).toBe(id);
  });
});
