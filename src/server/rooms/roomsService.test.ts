import { BadRequestError, NotFoundError } from '../errors'
import * as qrCodeGenerator from '../../utils/qrCodeGenerator'
import * as roomsRepository from './roomsRepository'
import { buildRoomUrl, getAllRoomsQr, getRoomQrPng } from './roomsService'

jest.mock('./roomsRepository')
jest.mock('../../utils/qrCodeGenerator')

const repo = jest.mocked(roomsRepository)
const generator = jest.mocked(qrCodeGenerator)

const ROOM_ID = '3f2a9c1e-7b4d-4e8a-9c12-5d6f8a0b1c2e'
const originalPublicUrl = process.env.PUBLIC_URL

beforeEach(() => {
  process.env.PUBLIC_URL = 'http://localhost:3000'
})

afterEach(() => {
  jest.resetAllMocks()
  process.env.PUBLIC_URL = originalPublicUrl
})

describe('buildRoomUrl', () => {
  it('monta a URL com o id da sala na query', () => {
    expect(buildRoomUrl(ROOM_ID)).toBe(`http://localhost:3000/?room=${ROOM_ID}`)
  })

  it('ignora a barra final do PUBLIC_URL', () => {
    process.env.PUBLIC_URL = 'http://localhost:3000/'

    expect(buildRoomUrl(ROOM_ID)).toBe(`http://localhost:3000/?room=${ROOM_ID}`)
  })

  it('lança erro quando o PUBLIC_URL não está configurado', () => {
    delete process.env.PUBLIC_URL

    expect(() => buildRoomUrl(ROOM_ID)).toThrow('PUBLIC_URL')
  })
})

describe('getRoomQrPng', () => {
  it('lança NotFoundError quando a sala não existe', async () => {
    repo.getRoomById.mockResolvedValue(null)

    await expect(getRoomQrPng(ROOM_ID)).rejects.toBeInstanceOf(NotFoundError)
    expect(generator.generateQrPng).not.toHaveBeenCalled()
  })

  it('lança BadRequestError quando a sala está inativa', async () => {
    repo.getRoomById.mockResolvedValue({ id: ROOM_ID, name: 'Sala 1', active: false })

    await expect(getRoomQrPng(ROOM_ID)).rejects.toBeInstanceOf(BadRequestError)
    expect(generator.generateQrPng).not.toHaveBeenCalled()
  })

  it('gera o QR com a URL da sala quando ela está ativa', async () => {
    repo.getRoomById.mockResolvedValue({ id: ROOM_ID, name: 'Sala 1', active: true })
    generator.generateQrPng.mockResolvedValue(Buffer.from('png'))

    const result = await getRoomQrPng(ROOM_ID)

    expect(generator.generateQrPng).toHaveBeenCalledWith(`http://localhost:3000/?room=${ROOM_ID}`)
    expect(result).toEqual(Buffer.from('png'))
  })
})

describe('getAllRoomsQr', () => {
  it('busca só as salas ativas e gera um QR para cada uma', async () => {
    const rooms = [
      { id: 'a', name: 'Sala A', active: true },
      { id: 'b', name: 'Sala B', active: true },
    ]
    repo.getAllRoomsByActive.mockResolvedValue(rooms)
    generator.generateQrSvg.mockResolvedValue('<svg></svg>')

    const result = await getAllRoomsQr()

    expect(repo.getAllRoomsByActive).toHaveBeenCalledWith(true)
    expect(result).toEqual([
      { room: rooms[0], url: 'http://localhost:3000/?room=a', svg: '<svg></svg>' },
      { room: rooms[1], url: 'http://localhost:3000/?room=b', svg: '<svg></svg>' },
    ])
  })
})