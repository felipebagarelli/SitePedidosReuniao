import { z } from 'zod'

export const orderItemSchema = z.object({
  foodId: z.uuid(),
  quantity: z.number().int().min(1).max(20),
})

export const createOrderSchema = z.object({
  roomId: z.uuid(),
  customer: z.string().trim().min(1).max(40),
  items: z.array(orderItemSchema).min(1),
  notes: z.string().trim().min(1).max(200).optional(),
})

export const orderStatusSchema = z.enum(['pending', 'delivered', 'cancelled'])

export const updateOrdersStatusSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
  status: orderStatusSchema,
})

export type UpdateOrdersStatusDTO = z.infer<typeof updateOrdersStatusSchema>
export type OrderItemDTO = z.infer<typeof orderItemSchema>
export type CreateOrderDTO = z.infer<typeof createOrderSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>


export interface OrderDetailDTO {
  id: string
  room: string
  customer: string
  status: OrderStatus
  createdAt: string
  items: { foodId: string; quantity: number }[]
  notes: string | null
}
