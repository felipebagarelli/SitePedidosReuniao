import request from 'supertest'
import type { RowDataPacket } from 'mysql2'
import { app } from '../app'
import { pool } from '../db/db'
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
    it('cria e grava a sala no banco e responde com a DTO', async () =>{
        const res = await request(app).post('/api/rooms')
        .send({name: 'Sala 1', active: true})

        expect(res.status).toBe(201)
        expect(res.body).toEqual({id: res.body.id, name: 'Sala 1', active: true})
        expect(await selectRoomRow(res.body.id)).toMatchObject({name: 'Sala 1', active: 1})
    })
    it('responde 400 quando a nome está vazio', async () => {
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

describe('GET /api/rooms/:id', () => {
  it('responde 200 com a sala', async () => {
    const created = await createRoom({ name: 'sala 1', active: true })

    const res = await request(app).get(`/api/rooms/${created.id}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(created)
  })

  it('responde 404 quando a sala não existe', async () => {
    const res = await request(app).get(`/api/rooms/${UNKNOWN_ID}`)

    expect(res.status).toBe(404)
  })

  it('responde 400 quando a id não é um UUID', async () => {
    const res = await request(app).get('/api/rooms/abc')

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/rooms/:id/active', () => {
  it('desativa a sala no banco e responde 200', async () => {
    const created = await createRoom({ name: 'sala 1',active: true })

    const res = await request(app).patch(`/api/rooms/${created.id}/active`).send({active: false})

    expect(res.status).toBe(200)
    expect((await selectRoomRow(created.id))?.active).toBe(0)
  })
  it('ativa a sala no banco e responde 200', async () => {
    const created = await createRoom({name: 'sala 1', active: false})
    const res = await request(app).patch(`/api/rooms/${created.id}/active`).send({active: true})

    expect(res.status).toBe(200)
    expect((await selectRoomRow(created.id))?.active).toBe(1)
  })

  it('responde 404 quando a sala não existe', async () => {
    const res = await request(app).patch(`/api/rooms/${UNKNOWN_ID}/active`).send({id: UNKNOWN_ID, active: false})

    expect(res.status).toBe(404)
  })

  it('responde 400 quando a id não é um UUID', async () => {
    const res = await request(app).patch('/api/rooms/abc/active').send({id: 'abc', active: false})

    expect(res.status).toBe(400)
  })
  
})
//falta colocar a get/id, put e patch ainda!!!!!