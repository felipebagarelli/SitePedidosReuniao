import type { RowDataPacket } from 'mysql2'
import { pool } from '../database/db'
import { createRoom } from '../rooms/roomsRepository'
import { createFood } from '../food/foodRepository'
import { createOrder, getOrderById, updateStatusOrderById, getAllOrders, getAllOrdersByStatus } from './ordersRepository'

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000'

let roomId: string
let foodId: string
let foodId2: string

beforeEach(async () => {
  roomId = (await createRoom({ name: 'Sala 1', active: true })).id
  foodId = (await createFood({ name: 'Café', description: null, active: true })).id
  foodId2 = (await createFood({ name: 'Água', description: null, active: true })).id
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

async function count(table: 'orders' | 'order_items') {
  const [rows] = await pool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${table}`)
  return Number(rows[0]?.total)
}

async function setCreatedAt(orderId: string, value: string) {
  await pool.execute('UPDATE orders SET created_at = ? WHERE id = ?', [value, orderId])
}

async function setStatus(orderId: string, status: 'pending' | 'delivered' | 'cancelled') {
  await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])
}





describe('createOrder', () => {
  it('grava o pedido em orders com status pending', async () => {
    const created = await createOrder({ roomId, customer: 'Felipe', items: [{ foodId, quantity: 1 }] })

    const row = await selectOrderRow(created.id)

    expect(row).toMatchObject({ room_id: roomId, customer: 'Felipe', status: 'pending' })
  })

  it('grava uma linha em order_items para cada item', async () => {
    const created = await createOrder({
      roomId,
      customer: 'Felipe',
      items: [{ foodId, quantity: 2 }, { foodId: foodId2, quantity: 3 }],
    })

    const rows = await selectItemRows(created.id)

    expect(rows).toHaveLength(2)
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ food_id: foodId, quantity: 2 }),
      expect.objectContaining({ food_id: foodId2, quantity: 3 }),
    ]))
  })

  it('devolve o DTO com os itens e createdAt como texto', async () => {
    const created = await createOrder({ roomId, customer: 'Felipe', items: [{ foodId, quantity: 2 }] })

    expect(created).toEqual({
      id: created.id,
      room: roomId,
      customer: 'Felipe',
      status: 'pending',
      createdAt: expect.any(String),
      items: [{ foodId, quantity: 2 }],
    })
  })

  it('gera ids diferentes para pedidos diferentes', async () => {
    const a = await createOrder({ roomId, customer: 'A', items: [{ foodId, quantity: 1 }] })
    const b = await createOrder({ roomId, customer: 'B', items: [{ foodId, quantity: 1 }] })

    expect(a.id).not.toBe(b.id)
  })

  it('rejeita alimento inexistente e não grava nada', async () => {
    await expect(
      createOrder({ roomId, customer: 'Felipe', items: [{ foodId: UNKNOWN_ID, quantity: 1 }] })
    ).rejects.toThrow('Alimentos indisponíveis')

    expect(await count('orders')).toBe(0)
    expect(await count('order_items')).toBe(0)
  })

  it('rejeita alimento inativo e não grava nada', async () => {
    const inactive = await createFood({ name: 'Esgotado', description: null, active: false })

    await expect(
      createOrder({ roomId, customer: 'Felipe', items: [{ foodId: inactive.id, quantity: 1 }] })
    ).rejects.toThrow('Alimentos indisponíveis')

    expect(await count('orders')).toBe(0)
  })

  it('rejeita sala inexistente e não deixa pedido pela metade', async () => {
    await expect(
      createOrder({ roomId: UNKNOWN_ID, customer: 'Felipe', items: [{ foodId, quantity: 1 }] })
    ).rejects.toThrow()

    expect(await count('orders')).toBe(0)
    expect(await count('order_items')).toBe(0)
  })
})

describe('getOrderById', () => {
  it('devolve o pedido com todos os itens', async () => {
    const created = await createOrder({
      roomId,
      customer: 'Felipe',
      items: [{ foodId, quantity: 2 }, { foodId: foodId2, quantity: 3 }],
    })

    const found = await getOrderById(created.id)

    expect(found).toMatchObject({ id: created.id, room: roomId, customer: 'Felipe', status: 'pending' })
    expect(found?.items).toHaveLength(2)
    expect(found?.items).toEqual(expect.arrayContaining([
      { foodId, quantity: 2 },
      { foodId: foodId2, quantity: 3 },
    ]))
  })

  it('devolve createdAt como texto', async () => {
    const created = await createOrder({ roomId, customer: 'Felipe', items: [{ foodId, quantity: 1 }] })

    const found = await getOrderById(created.id)

    expect(typeof found?.createdAt).toBe('string')
  })

  it('devolve null quando o id não existe', async () => {
    expect(await getOrderById(UNKNOWN_ID)).toBeNull()
  })
})

describe('getAllOrders', () => {
  it('devolve lista vazia quando não há pedidos', async () => {
    expect(await getAllOrders()).toEqual([])
  })

  it('cada pedido vem só com os seus itens', async () => {
    const a = await createOrder({ roomId, customer: 'A', items: [{ foodId, quantity: 1 }] })
    const b = await createOrder({ roomId, customer: 'B', items: [{ foodId: foodId2, quantity: 5 }] })

    const orders = await getAllOrders()

    expect(orders.find(o => o.id === a.id)?.items).toEqual([{ foodId, quantity: 1 }])
    expect(orders.find(o => o.id === b.id)?.items).toEqual([{ foodId: foodId2, quantity: 5 }])
  })

  it('ordena do mais novo para o mais antigo', async () => {
    const older = await createOrder({ roomId, customer: 'Antigo', items: [{ foodId, quantity: 1 }] })
    const newer = await createOrder({ roomId, customer: 'Novo', items: [{ foodId, quantity: 1 }] })
    await setCreatedAt(older.id, '2026-01-01 10:00:00')
    await setCreatedAt(newer.id, '2026-01-01 11:00:00')

    const orders = await getAllOrders()

    expect(orders.map(o => o.id)).toEqual([newer.id, older.id])
  })
})

describe('getAllOrdersByStatus', () => {
  it('devolve só os pedidos do status pedido, com os itens', async () => {
    const pending = await createOrder({ roomId, customer: 'Pendente', items: [{ foodId, quantity: 2 }] })
    const delivered = await createOrder({ roomId, customer: 'Entregue', items: [{ foodId: foodId2, quantity: 1 }] })
    await setStatus(delivered.id, 'delivered')

    const pendings = await getAllOrdersByStatus('pending')
    const delivereds = await getAllOrdersByStatus('delivered')

    expect(pendings.map(o => o.id)).toEqual([pending.id])
    expect(pendings[0]?.items).toEqual([{ foodId, quantity: 2 }])
    expect(delivereds.map(o => o.id)).toEqual([delivered.id])
  })

  it('ordena do mais antigo para o mais novo (fila da copa)', async () => {
    const older = await createOrder({ roomId, customer: 'Antigo', items: [{ foodId, quantity: 1 }] })
    const newer = await createOrder({ roomId, customer: 'Novo', items: [{ foodId, quantity: 1 }] })
    await setCreatedAt(older.id, '2026-01-01 10:00:00')
    await setCreatedAt(newer.id, '2026-01-01 11:00:00')

    const orders = await getAllOrdersByStatus('pending')

    expect(orders.map(o => o.id)).toEqual([older.id, newer.id])
  })

  it('devolve lista vazia quando nenhum pedido tem o status', async () => {
    await createOrder({ roomId, customer: 'Felipe', items: [{ foodId, quantity: 1 }] })

    expect(await getAllOrdersByStatus('cancelled')).toEqual([])
  })
})

describe('updateStatusOrderById', () => {
  it('altera o status no banco e devolve o pedido atualizado', async () => {
    const created = await createOrder({ roomId, customer: 'Felipe', items: [{ foodId, quantity: 1 }] })

    const updated = await updateStatusOrderById(created.id, 'delivered')

    expect(updated?.status).toBe('delivered')
    expect((await selectOrderRow(created.id))?.status).toBe('delivered')
  })

  it('não altera os outros pedidos', async () => {
    const target = await createOrder({ roomId, customer: 'Alvo', items: [{ foodId, quantity: 1 }] })
    const other = await createOrder({ roomId, customer: 'Outro', items: [{ foodId, quantity: 1 }] })

    await updateStatusOrderById(target.id, 'cancelled')

    expect((await selectOrderRow(other.id))?.status).toBe('pending')
  })

  it('devolve null quando o id não existe', async () => {
    expect(await updateStatusOrderById(UNKNOWN_ID, 'delivered')).toBeNull()
  })
})