import { useEffect, useState } from "react"
import { FoodDTO } from "../../../shared/foodDTO"
import { AddFoodForm } from "./AddFoodForm"
import { UpdateFoodForm } from "./UpdateFoodForm"
import './foods.css'

type Status = 'active' | 'inactive' | 'all'


export function FoodTab() {
    const [foods, setFoods] = useState<FoodDTO[]>([])
    const [loadingFoods, setLoadingFoods] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [showUpdateForm, setShowUpdateForm] = useState(false)
    const [status, setStatus] = useState<Status>('all')
    const [editingId, setEditingId] = useState<string | null>(null)


    async function loadFoods() {
        const data = await fetch('/api/foods').then(res => res.json())
        setFoods(data)
    }

    useEffect(() => {
        loadFoods()
        setLoadingFoods(false)
    }, [])

    const visibleFoods = foods.filter(food => {
        if (status === 'active') return food.active
        if (status === 'inactive') return !food.active
        return true
    })



    return (

        <div>

            <main>
                <div className="food-list">

                    <div>
                        <h2>Alimentos</h2>
                        <button type="button" onClick={() => setShowAddForm(true)}>Adicionar</button>

                        {showAddForm && (<AddFoodForm onSaved={() => { loadFoods(), setShowAddForm(false) }} onCancel={() => setShowAddForm(false)} />)}

                    </div>

                    <select value={status} onChange={e => setStatus(e.target.value as Status)}>
                        <option value="all">Todos</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>

                    {visibleFoods.map(food => (
                        <div key={food.id} className="food-item">
                            <div className="food-card">
                                {food.imageUrl ? (
                                    <img src={food.imageUrl} alt={food.name} className="food-image" />
                                ) : (
                                    <div className="food-image food-image-placeholder" />
                                )}

                                <div className="food-info">
                                    <h3>{food.name}</h3>
                                    <p>{food.description}</p>
                                </div>

                                <div className="form-update">
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(editingId === food.id ? null : food.id)}
                                    >
                                        {editingId === food.id ? 'Fechar' : 'Editar'}
                                    </button>
                                </div>
                            </div>

                            {editingId === food.id && (
                                <div className="food-edit">
                                    <UpdateFoodForm
                                        food={food}
                                        onSaved={() => {
                                            setEditingId(null)
                                            loadFoods()
                                        }}
                                        onCancel={() => setEditingId(null)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

            </main>
        </div>
    )





}