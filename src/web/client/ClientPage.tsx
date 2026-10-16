import { useState, useEffect } from 'react'
import type { FoodDTO } from '../../shared/foodDTO'
import type { RoomDTO } from '../../shared/roomsDTO'

type ClientPageProps = {
    roomId: string
}

export function ClientPage(props: ClientPageProps) {
    const [room, setRoom] = useState<RoomDTO | null>(null)
    const [roomError, setRoomError] = useState(false)
    const [foods, setFoods] = useState<FoodDTO[]>([])
    const [customer, setCustomer] = useState('')
    const [quantities, setQuantities] = useState<Record<string, number>>({})
    const [sent, setSent] = useState(false)

    useEffect(() => {
        fetch(`/api/rooms/${props.roomId}`).then(res => {
            if (!res.ok) {
                setRoomError(true)
                return
            }
            res.json().then(setRoom)
        })

        fetch('/api/foods?active=true')
            .then(res => res.json())
            .then(setFoods)
    }, [])

    function add(foodId: string) {
        const current = quantities[foodId] ?? 0
        if (current >= 20) return
        setQuantities({ ...quantities, [foodId]: current + 1 })
    }

    function remove(foodId: string) {
        const current = quantities[foodId] ?? 0
        if (current <= 0) return
        setQuantities({ ...quantities, [foodId]: current - 1 })
    }

    async function submitOrder() {
        const items = Object.entries(quantities)
            .filter(([, qty]) => qty > 0)
            .map(([foodId, quantity]) => ({ foodId, quantity }))

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: props.roomId, customer: customer.trim(), items }),
        })

        if (!res.ok) {
            alert('Não foi possível enviar o pedido. Tente novamente.')
            return
        }

        setSent(true)
    }

    const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0)

    if (roomError) {
        return <p>QR Code inválido. Escaneie novamente o código da sala.</p>
    }
    if (sent) {
        return <h2>Pedido enviado! Já levamos até você.</h2>
    }
    return (
        <div>
            <header>
                <img src="/logo.png" alt="Logo" />
                <h1>Pedido de reunião</h1>
                <p>{room ? room.name : 'Carregando sala...'}</p>
            </header>

            <main>

                <h2>Cardápio</h2>
                {foods.map(food => (
                    <div key={food.id} className="food-card">
                        {food.imageUrl ? (
                            <img src={food.imageUrl} alt={food.name} className="food-image" />
                        ) : (
                            <div className="food-image food-image-placeholder" />
                        )}

                        <div className="food-info">
                            <h3>{food.name}</h3>
                            <p>{food.description}</p>
                        </div>

                        <div className="food-quantity">
                            <button onClick={() => remove(food.id)}>−</button>
                            <span>{quantities[food.id] ?? 0}</span>
                            <button onClick={() => add(food.id)}>+</button>
                        </div>
                    </div>
                ))}
            </main>

            <footer>
                <p>{totalItems === 0 ? 'Nenhum item selecionado' : `${totalItems} item(ns) selecionado(s)`}</p>
                <button onClick={submitOrder} disabled={totalItems === 0 || customer.trim() === ''}>
                    Enviar pedido
                </button>
            </footer>
        </div>
    )
}