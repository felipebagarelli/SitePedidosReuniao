import request from 'supertest'
import type { RowDataPacket } from 'mysql2'
import { app } from '../app'
import { pool } from '../db/db'
import { createRoom } from '../rooms/roomsRepository'
import { createFood } from '../food/foodRepository'
import { createOrder } from './ordersRepository'

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000'

let roomId: string
let foodId: string
let foodId2: string

beforeEach(async () => {
  roomId = (await createRoom({ name: 'Sala 1', active: true })).id
  foodId = (await createFood({ name: 'Café', description: null, active: true, imageUrl: 'urlteste' })).id
  foodId2 = (await createFood({ name: 'Água', description: null, active: true, imageUrl: 'urlteste' })).id
})

async function selectOrderRow(id: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, room_id, customer, status FROM orders WHERE id = ?',
    [id]
  )
  return rows[0]
}

async function selectItemRows(orderId: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT food_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  )
  return rows
}

async function countOrders() {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM orders')
  return Number(rows[0]?.total)
}

async function setStatus(orderId: string, status: 'pending' | 'delivered' | 'cancelled') {
  await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])
}

describe('POST /api/orders', () => {
  it('cria o pedido, grava pedido e itens no banco e responde 201 com o DTO', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ roomId, customer: 'Ana', items: [{ foodId, quantity: 2 }, { foodId: foodId2, quantity: 1 }] })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ room: roomId, customer: 'Ana', status: 'pending' })
    expect(typeof res.body.createdAt).toBe('string')
    expect(res.body.items).toHaveLength(2)

    expect(await selectOrderRow(res.body.id)).toMatchObject({ room_id: roomId, customer: 'Ana', status: 'pending' })
    expect(await selectItemRows(res.body.id)).toHaveLength(2)
  })

  it('responde 400 quando o nome do cliente está vazio', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ roomId, customer: '', items: [{ foodId, quantity: 1 }] })

    expect(res.status).toBe(400)
    expect(await countOrders()).toBe(0)
  })

  it('responde 400 quando não há itens', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ roomId, customer: 'Ana', items: [] })

    expect(res.status).toBe(400)
  })

  it('responde 400 quando a quantidade é inválida', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ roomId, customer: 'Ana', items: [{ foodId, quantity: 0 }] })

    expect(res.status).toBe(400)
  })

  it('responde 400 quando o roomId não é um UUID', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ roomId: 'abc', customer: 'Ana', items: [{ foodId, quantity: 1 }] })

    expect(res.status).toBe(400)
  })

  it('responde 400 quando não há corpo', async () => {
    const res = await request(app).post('/api/orders')

    expect(res.status).toBe(400)
  })

  
  it('responde 400 e não grava nada quando o alimento não existe', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ roomId, customer: 'Ana', items: [{ foodId: UNKNOWN_ID, quantity: 1 }] })

    expect(res.status).toBe(400)
    expect(await countOrders()).toBe(0)
  })
})

describe('GET /api/orders', () => {
  it('devolve todos os pedidos quando não há ?status=', async () => {
    const a = await createOrder({ roomId, customer: 'A', items: [{ foodId, quantity: 1 }] })
    const b = await createOrder({ roomId, customer: 'B', items: [{ foodId, quantity: 1 }] })
    await setStatus(b.id, 'delivered')

    const res = await request(app).get('/api/orders')

    expect(res.status).toBe(200)
    expect(res.body.map((o: { id: string }) => o.id).sort()).toEqual([a.id, b.id].sort())
  })

  it('com ?status=pending devolve só os pendentes, com os itens', async () => {
    const pending = await createOrder({ roomId, customer: 'Pendente', items: [{ foodId, quantity: 2 }] })
    const delivered = await createOrder({ roomId, customer: 'Entregue', items: [{ foodId: foodId2, quantity: 1 }] })
    await setStatus(delivered.id, 'delivered')

    const res = await request(app).get('/api/orders').query({ status: 'pending' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe(pending.id)
    expect(res.body[0].items).toEqual([{ foodId, quantity: 2 }])
  })

  it('responde 400 quando o status é inválido', async () => {
    const res = await request(app).get('/api/orders').query({ status: 'banana' })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/orders/:id', () => {
  it('responde 200 com o pedido e os itens', async () => {
    const created = await createOrder({ roomId, customer: 'Ana', items: [{ foodId, quantity: 3 }] })

    const res = await request(app).get(`/api/orders/${created.id}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: created.id, customer: 'Ana', status: 'pending' })
    expect(res.body.items).toEqual([{ foodId, quantity: 3 }])
  })

  it('responde 404 quando o pedido não existe', async () => {
    const res = await request(app).get(`/api/orders/${UNKNOWN_ID}`)

    expect(res.status).toBe(404)
  })

  it('responde 400 quando o id não é um UUID', async () => {
    const res = await request(app).get('/api/orders/abc')

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/orders/:id/status', () => {
  it('altera o status no banco e responde 200 com o pedido atualizado', async () => {
    const created = await createOrder({ roomId, customer: 'Ana', items: [{ foodId, quantity: 1 }] })

    const res = await request(app)
      .patch(`/api/orders/${created.id}/status`)
      .send({ status: 'delivered' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('delivered')
    expect((await selectOrderRow(created.id))?.status).toBe('delivered')
  })

  it('responde 404 quando o pedido não existe', async () => {
    const res = await request(app)
      .patch(`/api/orders/${UNKNOWN_ID}/status`)
      .send({ status: 'delivered' })

    expect(res.status).toBe(404)
  })

  it('responde 400 quando o status é inválido e não altera o pedido', async () => {
    const created = await createOrder({ roomId, customer: 'Ana', items: [{ foodId, quantity: 1 }] })

    const res = await request(app)
      .patch(`/api/orders/${created.id}/status`)
      .send({ status: 'banana' })

    expect(res.status).toBe(400)
    expect((await selectOrderRow(created.id))?.status).toBe('pending')
  })

  it('responde 400 quando não há status no corpo', async () => {
    const created = await createOrder({ roomId, customer: 'Ana', items: [{ foodId, quantity: 1 }] })

    const res = await request(app).patch(`/api/orders/${created.id}/status`)

    expect(res.status).toBe(400)
  })

  it('responde 400 quando o id não é um UUID', async () => {
    const res = await request(app)
      .patch('/api/orders/abc/status')
      .send({ status: 'delivered' })

    expect(res.status).toBe(400)
  })
})