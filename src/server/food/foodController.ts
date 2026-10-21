import type { Request, Response } from 'express'
import { z } from 'zod'
import { createFoodSchema, updateFoodActiveSchema } from '../../shared/foodDTO'
import { createFood, getActiveFoods, getAllFoods, getFoodById, updateFood, getInactiveFoods, updateFoodActiveById } from './foodRepository'

export async function create(req: Request, res: Response) {
  const parsed = createFoodSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.issues })
  }

  const food = await createFood(parsed.data)
  res.status(201).json(food)
}

export async function list(req: Request, res: Response) {
  const foods = req.query.active === 'true' ? await getActiveFoods() : req.query.active === 'false' ? await getInactiveFoods : await getAllFoods()
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

export async function updateActive(req: Request, res: Response) {
    const parsed = updateFoodActiveSchema.safeParse({ ...req.body, id: req.params.id })
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.issues })
    }

    const food = await updateFoodActiveById(parsed.data)
    if (!food) {
        return res.status(404).json({ error: 'Alimento não encontrado' })
    }

    res.json(food)
}



