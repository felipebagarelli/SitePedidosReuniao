import { z } from 'zod'

export const createFoodSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(80).nullable(),
  active: z.boolean().default(true),
  imageUrl: z.string().max(255).nullable(),
})

export const foodSchema = createFoodSchema.extend({
  id: z.uuid(),
})

export const updateFoodActiveSchema = z.object({
  id: z.uuid(),
  active: z.boolean(),
})

export type UpdateFoodActiveDTO = z.infer<typeof updateFoodActiveSchema>

export type CreateFoodDTO = z.infer<typeof createFoodSchema>
export type FoodDTO = z.infer<typeof foodSchema>
