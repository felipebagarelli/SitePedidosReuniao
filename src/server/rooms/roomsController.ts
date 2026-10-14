import type { Request, Response } from 'express'
import { z } from 'zod'
import { CreateRoomSchema, UpdateRoomActiveSchema } from '../../shared/roomsDTO'
import { createRoom, getAllRooms, getAllRoomsByActive, getRoomById, updateRoomActiveById } from './roomsRepository'

export async function list(req: Request, res: Response) {
  const rooms = req.query.active === 'true' ? await getAllRoomsByActive(true) : await getAllRooms()
  res.json(rooms)
}

export async function getById(req: Request, res: Response) {
  const idParsed = z.uuid().safeParse(req.params.id)
  if (!idParsed.success) {
    return res.status(400).json({ error: 'Id inválido' })
  }

  const room = await getRoomById(idParsed.data)
  if (!room) {
    return res.status(404).json({ error: 'Sala não encontrada' })
  }

  res.json(room)
}

export async function create(req: Request, res: Response) {
  const parsed = CreateRoomSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.issues })
  }

  const room = await createRoom(parsed.data)
  res.status(201).json(room)
}

export async function updateActive(req: Request, res: Response) {
  const parsed = UpdateRoomActiveSchema.safeParse({ ...req.body, id: req.params.id })
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.issues })
  }

  const room = await updateRoomActiveById(parsed.data)
  if (!room) {
    return res.status(404).json({ error: 'Sala não encontrada' })
  }

  res.json(room)
}