import { useState, useEffect } from 'react'
import type { FoodDTO } from '../../shared/foodDTO'
import type { RoomDTO } from '../../shared/roomsDTO'
import './client.css'

type ClientPageProps = {
    roomId: string
}

export function ClientPage(props: ClientPageProps) {

    const [room, setRoom] = useState<RoomDTO | null>(null)
    const [roomError, setRoomError] = useState(false)
    const [foods, setFoods] = useState<FoodDTO[]>([])
    const [loadingFoods, setLoadingFoods] = useState(true)
    const [customer, setCustomer] = useState('')
    const [quantities, setQuantities] = useState<Record<string, number>>({})
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

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
            .then(data => {
                setFoods(data)
                setLoadingFoods(false)
            })
            .catch(() => setLoadingFoods(false))
    }, [])

    // funções
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
        setSending(true)
        setErrorMessage('')

        const items = Object.entries(quantities)
            .filter(([, qty]) => qty > 0)
            .map(([foodId, quantity]) => ({ foodId, quantity }))

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: props.roomId, customer: customer.trim(), items }),
            })

            if (!res.ok) {
                setErrorMessage('Não foi possível enviar o pedido. Tente novamente.')
                return
            }

            setSent(true)
        } catch {
            setErrorMessage('Sem conexão. Verifique a internet e tente novamente.')
        } finally {
            setSending(false)
        }
    }

    function newOrder() {
        setQuantities({})
        setSent(false)
    }

    // total itens
    const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0)

    // Telas de erro qr code
    if (roomError) {
        return (
            <div className="state-screen">
                <h2>QR Code inválido</h2>
                <p>Escaneie novamente o código da sala.</p>
            </div>
        )
    }

    if (sent) {
        return (
            <div className="state-screen">
                <h2>Pedido enviado!</h2>
                <p>Já levamos até você.</p>
                <button onClick={newOrder}>Fazer outro pedido</button>
            </div>
        )
    }

    return (
        <div className="client-page">
            <header>
                <img src="/images/logo/logo.png" alt="Logo" />
                <h1>Pedido de reunião</h1>
                <p>{room ? room.name : 'Carregando sala...'}</p>
            </header>

            <main>
                <div className="food-list">
                    <h2>Cardápio</h2>

                    {loadingFoods && <p className="empty-message">Carregando cardápio...</p>}
                    {!loadingFoods && foods.length === 0 && (
                        <p className="empty-message">Nenhum item disponível no momento.</p>
                    )}

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
                                <button
                                    type="button"
                                    aria-label={`Remover ${food.name}`}
                                    onClick={() => remove(food.id)}
                                    disabled={(quantities[food.id] ?? 0) === 0}
                                >
                                    −
                                </button>
                                <span>{quantities[food.id] ?? 0}</span>
                                <button
                                    type="button"
                                    aria-label={`Adicionar ${food.name}`}
                                    onClick={() => add(food.id)}
                                    disabled={(quantities[food.id] ?? 0) >= 20}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <footer>
                <div className="footer-info">
                    <p>{totalItems === 0 ? 'Nenhum item selecionado' : `${totalItems} item(ns) selecionado(s)`}</p>
                    {totalItems === 0 || customer.trim() === '' ? (
                        <p>Selecione um item e informe seu nome.</p>
                    ) : null}
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                </div>

                <div className="footer-actions">
                    <input
                        type="text"
                        aria-label="Seu nome"
                        placeholder="Como você se chama?"
                        maxLength={40}
                        value={customer}
                        onChange={e => setCustomer(e.target.value)}
                    />
                    <button
                        onClick={submitOrder}
                        disabled={totalItems === 0 || customer.trim() === '' || sending}
                    >
                        {sending ? 'Enviando...' : 'Enviar pedido'}
                    </button>
                </div>
            </footer>
        </div>
    )
}