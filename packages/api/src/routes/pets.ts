import { Router, type Request, type Response, type NextFunction } from 'express';
import type { DbAdapter } from '../types.js';
import { insertPetInstanceSchema } from './validation.js';

export function petsRouter(db: DbAdapter): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pets = await db.pets.listByCompany(req.params.companyId as string);
      res.json(pets);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:petId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pet = await db.pets.getById(req.params.petId as string, req.params.companyId as string);
      if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
      }
      res.json(pet);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = insertPetInstanceSchema.safeParse({
        id: crypto.randomUUID(),
        companyId: req.params.companyId as string,
        ...req.body,
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const pet = await db.pets.create(parsed.data);
      res.status(201).json(pet);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:petId/state', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { state } = req.body;
      if (!state) {
        return res.status(400).json({ error: 'state is required' });
      }

      const updated = await db.pets.updateState(req.params.petId as string, req.params.companyId as string, state);
      if (!updated) {
        return res.status(404).json({ error: 'Pet not found' });
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
