import type { OrderDetailDTO } from '../../shared/ordersDTO'
import { getAllFoods } from '../food/foodRepository'
import { getRoomById } from '../rooms/roomsRepository'
import { isZapiConfigured, sendGroupMessage } from '../whatsapp/zapiClient'

export function buildOrderMessage(
    order: OrderDetailDTO,
    roomName: string,
    foodNames: Record<string, string>
): string {
    const time = new Date(order.createdAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
    })

    const lines = [
        '🔔 *Novo pedido*',
        `📍 *${roomName}*`,
        `👤 ${order.customer}`,
        '',
        ...order.items.map(item => `• ${item.quantity}× ${foodNames[item.foodId] ?? 'Item'}`),
    ]

    if (order.notes) {
        lines.push('', `📝 Obs.: ${order.notes}`)
    }

    lines.push('', `🕒 ${time}`)

    return lines.join('\n')
}

export async function notifyNewOrder(order: OrderDetailDTO): Promise<void> {
    if (!isZapiConfigured()) return

    try {
        const room = await getRoomById(order.room)
        const foods = await getAllFoods()
        const foodNames = Object.fromEntries(foods.map(food => [food.id, food.name]))

        await sendGroupMessage(buildOrderMessage(order, room?.name ?? 'Sala', foodNames))
    } catch (err) {
        console.error('Falha ao enviar o pedido ao WhatsApp:', err instanceof Error ? err.message : err)
    }
}