import request from 'supertest'
import type { RowDataPacket } from 'mysql2'
import { app } from '../app'
import { pool } from '../database/db'
import {createFood} from './foodRepository'

async function selectFoodRow(id: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, description, active FROM foods WHERE id = ?',
    [id]
  )
  return rows[0]
}

describe('POST /api/foods', () => {
  it('cria um alimento e responde 201 com o DTO', async () => {
    const res = await request(app)
      .post('/api/foods')
      .send({ name: 'Café', description: 'Xícara', active: true })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: res.body.id, name: 'Café', description: 'Xícara', active: true })
  })

  it('grava o alimento no banco', async () => {
    const res = await request(app)
      .post('/api/foods')
      .send({ name: 'Café', description: 'Xícara', active: true })

    const row = await selectFoodRow(res.body.id)

    expect(row).toMatchObject({ name: 'Café', description: 'Xícara', active: 1 })
  })

  it('usa active true quando o campo não é enviado', async () => {
    const res = await request(app)
      .post('/api/foods')
      .send({ name: 'Café', description: null })

    expect(res.status).toBe(201)
    expect(res.body.active).toBe(true)
  })

  it('responde 400 quando o nome está vazio', async () => {
    const res = await request(app)
      .post('/api/foods')
      .send({ name: '', description: null })

    expect(res.status).toBe(400)
  })

  it('responde 400 quando não há corpo', async () => {
    const res = await request(app).post('/api/foods')

    expect(res.status).toBe(400)
  })
})

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000'

describe('GET /api/foods', () => {
  it('responde 200 com lista vazia quando não há alimentos', async () => {
    const res = await request(app).get('/api/foods')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('devolve todos, inclusive os inativos', async () => {
    await createFood({ name: 'Ativo', description: null, active: true })
    await createFood({ name: 'Inativo', description: null, active: false })

    const res = await request(app).get('/api/foods')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('com ?active=true devolve só os ativos', async () => {
    await createFood({ name: 'Ativo', description: null, active: true })
    await createFood({ name: 'Inativo', description: null, active: false })

    const res = await request(app).get('/api/foods').query({ active: 'true' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Ativo')
  })
})

describe('GET /api/foods/:id', () => {
  it('responde 200 com o alimento', async () => {
    const created = await createFood({ name: 'Café', description: 'Xícara', active: true })

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
  it('altera todos os campos e responde 200 com o alimento atualizado', async () => {
    const created = await createFood({ name: 'Nome antigo', description: 'Descrição antiga', active: true })

    const res = await request(app)
      .put(`/api/foods/${created.id}`)
      .send({ name: 'Nome novo', description: 'Descrição nova', active: false })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: created.id, name: 'Nome novo', description: 'Descrição nova', active: false })
    expect(await selectFoodRow(created.id)).toMatchObject({ name: 'Nome novo', description: 'Descrição nova', active: 0 })
  })

  it('responde 404 quando o alimento não existe', async () => {
    const res = await request(app)
      .put(`/api/foods/${UNKNOWN_ID}`)
      .send({ name: 'X', description: null, active: true })

    expect(res.status).toBe(404)
  })

  it('responde 400 quando o corpo é inválido e não altera o alimento', async () => {
    const created = await createFood({ name: 'Café', description: null, active: true })

    const res = await request(app)
      .put(`/api/foods/${created.id}`)
      .send({ name: '', description: null, active: true })

    expect(res.status).toBe(400)
    expect((await selectFoodRow(created.id))?.name).toBe('Café')
  })

  it('responde 400 quando o id não é um UUID', async () => {
    const res = await request(app)
      .put('/api/foods/abc')
      .send({ name: 'X', description: null, active: true })

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/foods/:id/inactive', () => {
  it('desativa o alimento e responde 204', async () => {
    const created = await createFood({ name: 'Café', description: null, active: true })

    const res = await request(app).patch(`/api/foods/${created.id}/inactive`)

    expect(res.status).toBe(204)
    expect((await selectFoodRow(created.id))?.active).toBe(0)
  })

  it('não desativa os outros alimentos', async () => {
    const target = await createFood({ name: 'Alvo', description: null, active: true })
    const other = await createFood({ name: 'Outro', description: null, active: true })

    await request(app).patch(`/api/foods/${target.id}/inactive`)

    expect((await selectFoodRow(other.id))?.active).toBe(1)
  })

  it('responde 404 quando o alimento não existe', async () => {
    const res = await request(app).patch(`/api/foods/${UNKNOWN_ID}/inactive`)

    expect(res.status).toBe(404)
  })

  it('responde 400 quando o id não é um UUID', async () => {
    const res = await request(app).patch('/api/foods/abc/inactive')

    expect(res.status).toBe(400)
  })
})