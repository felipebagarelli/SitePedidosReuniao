import request from 'supertest'
import type { RowDataPacket } from 'mysql2'
import { app } from '../app'
import { pool } from '../database/db'
import { createRoom } from './roomsRepository'

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000'

async function selectRoomRow(id: string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, name, active FROM rooms WHERE id = ?',
        [id]
    )
    return rows[0]
}

describe('POST /api/rooms', () => {
    it('cria e grava a sala no banco e responde com o DTO', async () =>{
        const res = await request(app).post('/api/rooms')
        .send({name: 'Sala 1', active: true})

        expect(res.status).toBe(201)
        expect(res.body).toEqual({id: res.body.id, name: 'Sala 1', active: true})
        expect(await selectRoomRow(res.body.id)).toMatchObject({name: 'Sala 1', active: 1})
    })
    it('responde 400 quando o nome está vazio', async () => {
        const res = await request(app).post('/api/rooms').send({ name: '', active: true })
    
        expect(res.status).toBe(400)
    })
    
    it('responde 400 quando não há corpo', async () => {
        const res = await request(app).post('/api/rooms')
    
        expect(res.status).toBe(400)
    })
})

describe('GET /api/rooms', () => {
  it('devolve todas as salas, inclusive as inativas', async () => {
    await createRoom({ name: 'Ativo', active: true })
    await createRoom({ name: 'Inativo', active: false })

    const res = await request(app).get('/api/rooms')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('com ?active=true devolve só as ativas', async () => {
    await createRoom({ name: 'Ativo', active: true })
    await createRoom({ name: 'Inativo', active: false })

    const res = await request(app).get('/api/rooms').query({ active: 'true' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Ativo')
  })
})

//falta colocar o get/id, put e patch ainda!!!!!