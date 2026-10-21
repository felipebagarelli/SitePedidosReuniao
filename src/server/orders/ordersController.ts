import type { Request, Response } from 'express'
import { z } from 'zod'
import { createOrderSchema, orderStatusSchema, updateOrdersStatusSchema } from '../../shared/ordersDTO'
import { createOrder, getAllOrders, getAllOrdersByStatus, getOrderById, updateOrdersStatus, updateStatusOrderById } from './ordersRepository'
import { error } from 'node:console'

import { notifyNewOrder } from './orderNotification'

export async function create(req: Request, res: Response) {
    const parsed = createOrderSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.issues })
    }

    const order = await createOrder(parsed.data)

    void notifyNewOrder(order)

    res.status(201).json(order)
}

export async function listGetAllOrders(req: Request, res: Response) {
    const parsed = orderStatusSchema.optional().safeParse(req.query.status)
    if (!parsed.success) {
        return res.status(400).json({ error: 'Status inválido' })
    }

    const orders = parsed.data === undefined ? await getAllOrders() : await getAllOrdersByStatus(parsed.data)

    res.json(orders)
}

export async function getById(req: Request, res: Response) {
    const id = z.uuid().safeParse(req.params.id)
    if (!id.success) {
        return res.status(400).json({ error: 'Id inválido' })
    }
    const order = await getOrderById(id.data)
    if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' })
    }
    res.json(order)
}

export async function updateStatusById(req: Request, res: Response) {
    const id = z.uuid().safeParse(req.params.id)
    if (!id.success) {
        return res.status(400).json({ error: 'Id inválido' })
    }
    const status = orderStatusSchema.safeParse(req.body?.status)
    if (!status.success) {
        return res.status(400).json({ error: 'Status inválido' })
    }
    const order = await updateStatusOrderById(id.data, status.data)
    if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' })
    }

    res.json(order)

}

export async function updateStatusBatch(req: Request, res: Response) {
    const parsed = updateOrdersStatusSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.issues })
    }

    const updated = await updateOrdersStatus(parsed.data)
    res.json({ requested: new Set(parsed.data.ids).size, updated })
}