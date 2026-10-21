import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import type { CreateOrderDTO, OrderStatus, OrderDetailDTO, OrderItemDTO, UpdateOrdersStatusDTO } from '../../shared/ordersDTO'
import { randomUUID } from 'node:crypto'
import { pool } from '../db/db'
import { BadRequestError } from '../errors'
import { getRoomById } from '../rooms/roomsRepository'


export function toOrdemItemDTO(data: RowDataPacket): OrderItemDTO {
    return {
        foodId: data.food_id,
        quantity: data.quantity
    }

}

export function toOrderDTO(data: RowDataPacket, items: OrderDetailDTO['items']): OrderDetailDTO {
    return {
        id: data.id,
        room: data.room_id,
        customer: data.customer,
        status: data.status,
        createdAt: new Date(data.created_at).toISOString(),
        items: items,
        notes: data.notes
    }
}

export async function createOrder(order: CreateOrderDTO): Promise<OrderDetailDTO> {
    const id = randomUUID()
    const room = await getRoomById(order.roomId)
    if (!room || !room.active) {
        throw new BadRequestError('Sala indisponível')
    }
    const foodIds = [...new Set(order.items.map(item => item.foodId))]

    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM foods WHERE id IN (?) AND active = 1',
        [foodIds]
    )
    if (rows.length !== foodIds.length) {
        const found = new Set(rows.map(row => row.id))
        const missing = foodIds.filter(id => !found.has(id))
        throw new BadRequestError(`Alimentos indisponíveis: ${missing.join(', ')}`)
    }

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        await conn.execute<ResultSetHeader>(
            'INSERT INTO orders (id, room_id, customer, notes) VALUES (?, ?, ?, ?)',
            [id, room.id, order.customer, order.notes ?? null]
        )
        for (const item of order.items) {
            await conn.execute<ResultSetHeader>(
                'INSERT INTO order_items (id, order_id, food_id, quantity) VALUES (?, ?, ?, ?)',
                [randomUUID(), id, item.foodId, item.quantity]
            )
        }
        await conn.commit()
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }

    const created = await getOrderById(id)
    return created!
}

export async function getOrderById(id: string): Promise<OrderDetailDTO | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT o.id, o.room_id, o.customer, o.status, o.created_at, o.notes,
                i.food_id, i.quantity
         FROM orders o
         JOIN order_items i ON i.order_id = o.id
         WHERE o.id = ?`,
        [id]
    )

    const first = rows[0]
    if (!first) return null

    const items = rows.map(row => ({ foodId: row.food_id, quantity: row.quantity }))
    return toOrderDTO(first, items)
}

export async function updateStatusOrderById(id: string, status: OrderStatus): Promise<OrderDetailDTO | null> {
    await pool.execute<ResultSetHeader>(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, id]
    )
    return getOrderById(id)
}

export async function getAllOrders(): Promise<OrderDetailDTO[]> {
    const [rowsOrders] = await pool.execute<RowDataPacket[]>(
        'SELECT id, room_id, customer, status, created_at, notes FROM orders ORDER BY created_at DESC'
    )
    const [rowsItems] = await pool.execute<RowDataPacket[]>(
        'SELECT order_id, food_id, quantity FROM order_items'
    )

    //  agrupa os itens por pedido, uma vez só
    const itemsByOrder = new Map<string, OrderDetailDTO['items']>()
    for (const item of rowsItems) {
        const list = itemsByOrder.get(item.order_id) ?? []
        list.push({ foodId: item.food_id, quantity: item.quantity })
        itemsByOrder.set(item.order_id, list)
    }

    //  monta cada pedido com os itens dele
    return rowsOrders.map(order => toOrderDTO(order, itemsByOrder.get(order.id) ?? []))
}

export async function getAllOrdersByStatus(status: OrderStatus): Promise<OrderDetailDTO[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT o.id, o.room_id, o.customer, o.status, o.created_at, o.notes,
                i.food_id, i.quantity
         FROM orders o
         JOIN order_items i ON i.order_id = o.id
         WHERE o.status = ?
         ORDER BY o.created_at, o.id`,
        [status]
    )

    const orders = new Map<string, OrderDetailDTO>()
    for (const row of rows) {
        let order = orders.get(row.id)
        if (!order) {
            order = toOrderDTO(row, [])
            orders.set(row.id, order)
        }
        order.items.push({ foodId: row.food_id, quantity: row.quantity })
    }
    return [...orders.values()]
}

export async function updateOrdersStatus(data: UpdateOrdersStatusDTO): Promise<number> {
    const ids = [...new Set(data.ids)]

    const [result] = await pool.query<ResultSetHeader>(
        "UPDATE orders SET status = ? WHERE id IN (?) AND status = 'pending'",
        [data.status, ids]
    )

    return result.affectedRows
}
