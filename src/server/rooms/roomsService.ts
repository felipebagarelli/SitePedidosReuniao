import type { RoomDTO } from '../../shared/roomsDTO'
import { generateQrPng, generateQrSvg } from '../../utils/qrCodeGenerator'
import { BadRequestError, NotFoundError } from '../errors'
import { getAllRoomsByActive, getRoomById } from './roomsRepository'

export function buildRoomUrl(roomId: string): string {
  const baseUrl = process.env.PUBLIC_URL
  if (!baseUrl) {
    throw new Error('PUBLIC_URL não está configurada')
  }

  return `${baseUrl.replace(/\/+$/, '')}/?room=${encodeURIComponent(roomId)}`
}

async function findActiveRoom(roomId: string): Promise<RoomDTO> {
  const room = await getRoomById(roomId)
  if (!room) {
    throw new NotFoundError('Sala não encontrada')
  }
  if (!room.active) {
    throw new BadRequestError('Sala inativa')
  }

  return room
}

export async function getRoomQrPng(roomId: string): Promise<Buffer> {
  await findActiveRoom(roomId)

  return generateQrPng(buildRoomUrl(roomId))
}

export async function getAllRoomsQr(): Promise<{ room: RoomDTO; url: string; svg: string }[]> {
  const rooms = await getAllRoomsByActive(true)

  return Promise.all(
    rooms.map(async room => {
      const url = buildRoomUrl(room.id)
      return { room, url, svg: await generateQrSvg(url) }
    })
  )
}