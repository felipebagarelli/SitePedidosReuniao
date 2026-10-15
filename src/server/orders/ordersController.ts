import type { Request, Response } from 'express'
import { z } from 'zod'
import { createOrderSchema, orderStatusSchema } from '../../shared/ordersDTO'
import { createOrder, getAllOrders, getAllOrdersByStatus, getOrderById, updateStatusOrderById } from './ordersRepository'
import { error } from 'node:console'

export async function create(req: Request, res: Response) {
    const parsed = createOrderSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({ error: 'Dados Invalidos', details: parsed.error.issues })
    }
    const order = await createOrder(parsed.data)
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