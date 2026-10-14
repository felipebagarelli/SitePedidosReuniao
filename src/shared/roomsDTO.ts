import { z } from 'zod'

export const CreateRoomSchema = z.object({
  name: z.string().trim().min(1).max(40),
  active: z.boolean().default(true),
})

export const UpdateRoomActiveSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
})

export type CreateRoomDTO = z.infer<typeof CreateRoomSchema>
export type UpdateRoomActiveDTO = z.infer<typeof UpdateRoomActiveSchema>

export interface RoomDTO {
  id: string
  name: string
  active: boolean
}
