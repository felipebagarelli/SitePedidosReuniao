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
    //const [status, setStatus] = useState<>()
    const [listStatus, setListStatus] = useState<Status>('all')
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
        if (listStatus === 'active') return food.active
        if (listStatus === 'inactive') return !food.active
        return true
    })

    //função do switch inativo e ativo na tela admin
    async function toggleActive(food: FoodDTO) {
        const res = await fetch(`/api/foods/${food.id}/active`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !food.active }),
        })

        if (!res.ok) {
            alert('Não foi possível alterar o status do alimento.')
            return
        }

        await loadFoods()
    }



    return (

        <div>

            <main>
                <div className="food-list">

                    <div>
                        <h2>Cardápio</h2>
                        <button type="button" onClick={() => setShowAddForm(true)}>Adicionar</button>

                        {showAddForm && (<AddFoodForm onSaved={() => { loadFoods(), setShowAddForm(false) }} onCancel={() => setShowAddForm(false)} />)}

                    </div>

                    <select value={listStatus} onChange={e => setListStatus(e.target.value as Status)}>
                        <option value="all">Todos</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>

                    {visibleFoods.map(food => (
                        <div key={food.id} className="food-item">
                            <div className={`food-card ${food.active ? '' : 'inactive'}`}>
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
                                    <label className="switch" title={food.active ? 'Desativar' : 'Ativar'}>
                                        <input
                                            type="checkbox"
                                            checked={food.active}
                                            onChange={() => toggleActive(food)}
                                        />
                                        <span className="slider" />
                                    </label>

                                    <button type="button" onClick={() => setEditingId(editingId === food.id ? null : food.id)}>
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