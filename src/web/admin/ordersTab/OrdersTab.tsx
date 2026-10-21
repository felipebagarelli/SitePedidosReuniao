import { useEffect, useState } from "react"
import type { OrderDetailDTO } from "../../../shared/ordersDTO"
import type { RoomDTO } from "../../../shared/roomsDTO"
import type { FoodDTO } from "../../../shared/foodDTO"
import './orders.css'

type Filter = 'pending' | 'delivered' | 'all'

export function OrdersTab() {
    const [orders, setOrders] = useState<OrderDetailDTO[]>([])
    const [filter, setFilter] = useState<Filter>('pending')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [roomNames, setRoomNames] = useState<Record<string, string>>({})
    const [foodNames, setFoodNames] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    // nomes das salas e dos alimentos 
    useEffect(() => {
        fetch('/api/rooms')
            .then(res => res.json())
            .then((data: RoomDTO[]) => setRoomNames(Object.fromEntries(data.map(r => [r.id, r.name]))))

        fetch('/api/foods')
            .then(res => res.json())
            .then((data: FoodDTO[]) => setFoodNames(Object.fromEntries(data.map(f => [f.id, f.name]))))
    }, [])

    // pedidos carrega ao abrir, ao trocar o filtro e a cada 10s
    async function loadOrders() {
        try {
            const url = filter === 'all' ? '/api/orders' : `/api/orders?status=${filter}`
            const res = await fetch(url)
            if (!res.ok) throw new Error()

            const data: OrderDetailDTO[] = await res.json()
            setOrders(data)
            setSelectedIds(current => current.filter(id => data.some(order => order.id === id)))
            setErrorMessage('')
        } catch {
            setErrorMessage('Não foi possível atualizar a lista. Tentando novamente...')
        }
    }

    useEffect(() => {
        loadOrders()
        const timer = setInterval(loadOrders, 10000)
        return () => clearInterval(timer)
    }, [filter])

    // seleção 
    const selectable = orders.filter(order => order.status === 'pending')
    const allSelected = selectable.length > 0 && selectable.every(order => selectedIds.includes(order.id))
    const someSelected = selectedIds.length > 0

    function toggleOrder(id: string) {
        setSelectedIds(current =>
            current.includes(id) ? current.filter(x => x !== id) : [...current, id]
        )
    }

    function toggleAll() {
        setSelectedIds(allSelected ? [] : selectable.map(order => order.id))
    }

    // marcar como concluído 
    async function markAs(status: 'delivered' | 'cancelled') {
        setSaving(true)
        try {
            const res = await fetch('/api/orders/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, status }),
            })

            if (!res.ok) {
                alert('Não foi possível atualizar os pedidos.')
                return
            }

            setSelectedIds([])
            await loadOrders()
        } finally {
            setSaving(false)
        }
    }

    // agrupar por sala
    const groups = new Map<string, OrderDetailDTO[]>()
    for (const order of orders) {
        const list = groups.get(order.room) ?? []
        list.push(order)
        groups.set(order.room, list)
    }

    function formatTime(iso: string) {
        return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="orders-tab">
            <h2>Pedidos</h2>

            <div className="orders-toolbar">
                <select value={filter} onChange={e => setFilter(e.target.value as Filter)}>
                    <option value="pending">Pendentes</option>
                    <option value="delivered">Concluídos</option>
                    <option value="all">Todos</option>
                </select>

                <label className="select-all">
                    <input
                        type="checkbox"
                        ref={el => {
                            if (el) el.indeterminate = someSelected && !allSelected
                        }}
                        checked={allSelected}
                        onChange={toggleAll}
                        disabled={selectable.length === 0}
                    />
                    Selecionar todos
                </label>

                <button
                    type="button"
                    className="orders-action"
                    onClick={() => markAs('delivered')}
                    disabled={!someSelected || saving}
                >
                    {saving ? 'Salvando...' : `Marcar como concluído${someSelected ? ` (${selectedIds.length})` : ''}`}
                </button>
            </div>

            {errorMessage && <p className="orders-error">{errorMessage}</p>}

            {orders.length === 0 && <p className="empty-message">Nenhum pedido encontrado.</p>}

            {[...groups.entries()].map(([roomId, list]) => (
                <section key={roomId} className="order-room">
                    <h3>{roomNames[roomId] ?? 'Sala'}</h3>

                    {list.map(order => (
                        <label
                            key={order.id}
                            className={`order-card ${order.status !== 'pending' ? 'done' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(order.id)}
                                onChange={() => toggleOrder(order.id)}
                                disabled={order.status !== 'pending'}
                            />

                            <div className="order-body">
                                <div className="order-head">
                                    <strong>{order.customer}</strong>
                                    <span>{formatTime(order.createdAt)}</span>
                                </div>

                                <ul>
                                    {order.items.map(item => (
                                        <li key={item.foodId}>
                                            {item.quantity}× {foodNames[item.foodId] ?? 'Item'}
                                        </li>
                                    ))}
                                </ul>

                                {order.notes && <p className="order-notes">Obs.: {order.notes}</p>}
                            </div>

                            {order.status !== 'pending' && (
                                <span className={`order-status ${order.status}`}>
                                    {order.status === 'delivered' ? 'Concluído' : 'Cancelado'}
                                </span>
                            )}
                        </label>
                    ))}
                </section>
            ))}
        </div>
    )
}