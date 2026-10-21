  import request from 'supertest'
  import type { RowDataPacket } from 'mysql2'
  import { app } from '../app'
  import { pool } from '../db/db'
import { createFood } from './foodRepository'

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000'

async function selectFoodRow(id: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, description, active FROM foods WHERE id = ?',
    [id]
  )
  return rows[0]
}

describe('POST /api/foods', () => {
  it('cria o alimento, grava no banco e responde 201 com o DTO', async () => {
    const res = await request(app)
      .post('/api/foods')
      .send({ name: 'Café', description: 'Xícara', active: true, imageUrl: 'urlteste' })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: res.body.id, name: 'Café', description: 'Xícara', active: true, imageUrl: 'urlteste' })
    expect(await selectFoodRow(res.body.id)).toMatchObject({ name: 'Café', description: 'Xícara' })
  })

  it('usa active true quando o campo não é enviado', async () => {
    const res = await request(app).post('/api/foods').send({ name: 'Café', description: null, imageUrl: 'urlteste' })

    expect(res.status).toBe(201)
    expect(res.body.active).toBe(true)
  })

  it('responde 400 quando o nome está vazio', async () => {
    const res = await request(app).post('/api/foods').send({ name: '', description: null })

    expect(res.status).toBe(400)
  })

  it('responde 400 quando não há corpo', async () => {
    const res = await request(app).post('/api/foods')

    expect(res.status).toBe(400)
  })
})

describe('GET /api/foods', () => {
  it('devolve todos os alimentos, inclusive os inativos', async () => {
    await createFood({ name: 'Ativo', description: null, active: true, imageUrl: 'urlteste' })
    await createFood({ name: 'Inativo', description: null, active: false, imageUrl: 'urlteste' })

    const res = await request(app).get('/api/foods')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('com ?active=true devolve só os ativos', async () => {
    await createFood({ name: 'Ativo', description: null, active: true, imageUrl: 'urlteste' })
    await createFood({ name: 'Inativo', description: null, active: false, imageUrl: 'urlteste' })

    const res = await request(app).get('/api/foods').query({ active: 'true' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Ativo')
  })
})

describe('GET /api/foods/:id', () => {
  it('responde 200 com o alimento', async () => {
    const created = await createFood({ name: 'Café', description: 'Xícara', active: true, imageUrl: 'urlteste' })

    const res = await request(app).get(`/api/foods/${created.id}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(created)
  })

  it('responde 404 quando o alimento não existe', async () => {
    const res = await request(app).get(`/api/foods/${UNKNOWN_ID}`)

    expect(res.status).toBe(404)
  })

  it('responde 400 quando o id não é um UUID', async () => {
    const res = await request(app).get('/api/foods/abc')

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/foods/:id', () => {
  it('altera o alimento, grava no banco e responde 200 com o DTO atualizado', async () => {
    const created = await createFood({ name: 'Nome antigo', description: 'Descrição antiga', active: true, imageUrl: 'urlteste' })

    const res = await request(app)
      .put(`/api/foods/${created.id}`)
      .send({ name: 'Nome novo', description: 'Descrição nova', active: false, imageUrl: 'urlteste' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: created.id, name: 'Nome novo', description: 'Descrição nova', active: false, imageUrl: 'urlteste' })
    expect(await selectFoodRow(created.id)).toMatchObject({ name: 'Nome novo', description: 'Descrição nova', active: 0 })
  })

  it('responde 404 quando o alimento não existe', async () => {
    const res = await request(app)
      .put(`/api/foods/${UNKNOWN_ID}`)
      .send({ name: 'X', description: null, active: true, imageUrl: 'urlteste' })

    expect(res.status).toBe(404)
  })

  it('responde 400 quando o corpo é inválido e não altera o alimento', async () => {
    const created = await createFood({ name: 'Café', description: null, active: true, imageUrl: 'urlteste' })

    const res = await request(app)
      .put(`/api/foods/${created.id}`)
      .send({ name: '', description: null, active: true, imageUrl: 'urlteste' })

    expect(res.status).toBe(400)
    expect((await selectFoodRow(created.id))?.name).toBe('Café')
  })

  it('responde 400 quando o id não é um UUID', async () => {
    const res = await request(app)
      .put('/api/foods/abc')
      .send({ name: 'X', description: null, active: true, imageUrl: 'urlteste' })

    expect(res.status).toBe(400)
  })
})

