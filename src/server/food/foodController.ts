import type { Request, Response } from 'express'
import { z } from 'zod'
import { createFoodSchema } from '../../shared/foodDTO'
import { createFood, getActiveFoods, getAllFoods, getFoodById, updateFood, setInactiveFoodById } from './foodRepository'

export async function create(req: Request, res: Response) {
  const parsed = createFoodSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.issues })
  }

  const food = await createFood(parsed.data)
  res.status(201).json(food)
}

export async function list(req: Request, res: Response) {
  const foods = req.query.active === 'true' ? await getActiveFoods() : await getAllFoods()
  res.json(foods)
}

export async function getById(req: Request, res: Response) {
  const idParsed  = z.uuid().safeParse(req.params.id)
    if (!idParsed.success) {
    return res.status(400).json({ error: 'Id inválido' })
    }
  const food = await getFoodById(idParsed.data)
  if (!food) {
    return res.status(404).json({ error: 'Alimento não encontrado' })
  }
    res.json(food)
}

export async function update(req: Request, res: Response) {
    const idParsed  = z.uuid().safeParse(req.params.id)
    if (!idParsed.success) {
    return res.status(400).json({ error: 'Id inválido' })
    }
    const parsed = createFoodSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.issues })
    }
    const food = await updateFood(idParsed.data, parsed.data)
    if (!food) {
    return res.status(404).json({ error: 'Alimento não encontrado' })
    }
    res.json(food)
}

export async function setInactive(req: Request, res: Response) {
    const idParsed  = z.uuid().safeParse(req.params.id)
    if (!idParsed.success) {
    return res.status(400).json({ error: 'Id inválido' })
    }
    const success = await setInactiveFoodById(idParsed.data)
    if (!success) {
    return res.status(404).json({ error: 'Alimento não encontrado' })
    }
    res.sendStatus(204)
}



