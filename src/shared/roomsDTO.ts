import { z } from 'zod'

export const CreateRoomSchema = z.object({
  name: z.string().trim().min(1).max(40),
  active: z.boolean().default(true),
})

export type CreateRoomDTO = z.infer<typeof CreateRoomSchema>

export interface RoomDTO {
  id: string
  name: string
  active: boolean
}
