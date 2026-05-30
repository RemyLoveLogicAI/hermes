import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { speciesRouter } from '../src/routes/species.js';
import { petsRouter } from '../src/routes/pets.js';
import type { DbAdapter } from '../src/types.js';

function createTestApp(db: DbAdapter): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/species', speciesRouter(db));
  app.use('/pets', petsRouter(db));
  return app;
}

describe('Species routes', () => {
  let db: DbAdapter;
  let app: express.Express;

  beforeEach(() => {
    db = {
      species: {
        list: vi.fn().mockResolvedValue([
          { id: 'frygar', displayName: 'Frygar', role: 'fire' },
        ]),
        getById: vi.fn().mockImplementation((id: string) =>
          Promise.resolve(id === 'frygar' ? { id, displayName: 'Frygar', role: 'fire' } : undefined),
        ),
        create: vi.fn().mockImplementation((data: any) =>
          Promise.resolve({ id: data.id, ...data }),
        ),
      },
      pets: {
        listByCompany: vi.fn().mockResolvedValue([]),
        getById: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockResolvedValue({}),
        updateState: vi.fn().mockResolvedValue(undefined),
      },
    };
    app = createTestApp(db);
  });

  it('GET /species returns list', async () => {
    const res = await request(app).get('/species');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].displayName).toBe('Frygar');
  });

  it('GET /species/:id returns species', async () => {
    const res = await request(app).get('/species/frygar');
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Frygar');
  });

  it('GET /species/:id returns 404 for unknown', async () => {
    const res = await request(app).get('/species/unknown');
    expect(res.status).toBe(404);
  });

  it('POST /species creates a new species', async () => {
    const res = await request(app)
      .post('/species')
      .send({ displayName: 'TestPet', role: 'water', rpetContent: { formatVersion: 1 } });
    expect(res.status).toBe(201);
    expect(res.body.displayName).toBe('TestPet');
  });

  it('POST /species returns 400 for invalid data', async () => {
    const res = await request(app).post('/species').send({});
    expect(res.status).toBe(400);
  });
});

describe('Pets routes', () => {
  let db: DbAdapter;
  let app: express.Express;

  beforeEach(() => {
    db = {
      species: {
        list: vi.fn().mockResolvedValue([]),
        getById: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockResolvedValue({}),
      },
      pets: {
        listByCompany: vi.fn().mockResolvedValue([
          { id: 'pet-1', agentId: 'agent-1', currentState: 'idle' },
        ]),
        getById: vi.fn().mockImplementation((id: string) =>
          Promise.resolve(id === 'pet-1' ? { id, currentState: 'idle' } : undefined),
        ),
        create: vi.fn().mockImplementation((data: any) =>
          Promise.resolve({ id: data.id, ...data }),
        ),
        updateState: vi.fn().mockImplementation((id: string, _companyId: string, state: string) =>
          Promise.resolve(id === 'pet-1' ? { id, currentState: state } : undefined),
        ),
      },
    };
    app = createTestApp(db);
  });

  it('GET /pets returns list', async () => {
    const res = await request(app).get('/pets');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('GET /pets/:id returns pet', async () => {
    const res = await request(app).get('/pets/pet-1');
    expect(res.status).toBe(200);
    expect(res.body.currentState).toBe('idle');
  });

  it('GET /pets/:id returns 404 for unknown', async () => {
    const res = await request(app).get('/pets/unknown');
    expect(res.status).toBe(404);
  });

  it('PATCH /pets/:id/state updates state', async () => {
    const res = await request(app).patch('/pets/pet-1/state').send({ state: 'alert' });
    expect(res.status).toBe(200);
    expect(res.body.currentState).toBe('alert');
  });

  it('PATCH /pets/:id/state returns 400 without state', async () => {
    const res = await request(app).patch('/pets/pet-1/state').send({});
    expect(res.status).toBe(400);
  });

  it('PATCH /pets/:id/state returns 404 for unknown pet', async () => {
    const res = await request(app).patch('/pets/unknown/state').send({ state: 'alert' });
    expect(res.status).toBe(404);
  });
});
