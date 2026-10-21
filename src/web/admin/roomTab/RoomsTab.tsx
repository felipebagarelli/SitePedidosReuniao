import { useEffect, useState } from "react"
import { AddRoomForm } from "./AddRoomForm"
import { UpdateRoomForm } from "./UpdateRoomForm"
import { RoomDTO } from "../../../shared/roomsDTO"
import './rooms.css'

type Status = 'active' | 'inactive' | 'all'


export function RoomsTab() {
    const [rooms, setRooms] = useState<RoomDTO[]>([])
    const [loadingRooms, setLoadingRooms] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [showUpdateForm, setShowUpdateForm] = useState(false)
    const [listStatus, setListStatus] = useState<Status>('all')
    const [editingId, setEditingId] = useState<string | null>(null)


    async function loadRooms() {
        const data = await fetch('/api/rooms').then(res => res.json())
        setRooms(data)
    }

    useEffect(() => {
        loadRooms()
        setLoadingRooms(false)
    }, [])

    const visibleRooms = rooms.filter(room => {
        if (listStatus === 'active') return room.active
        if (listStatus === 'inactive') return !room.active
        return true
    })

    //função do switch inativo e ativo na tela admin
    async function toggleActive(room: RoomDTO) {
        const res = await fetch(`/api/rooms/${room.id}/active`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !room.active }),
        })

        if (!res.ok) {
            alert('Não foi possível alterar o status da sala.')
            return
        }

        await loadRooms()
    }



    return (

        <div>

            <main>
                <div className="room-list">

                    <div>
                        <h2>Salas</h2>
                        <button type="button" onClick={() => setShowAddForm(true)}>Adicionar</button>

                        {showAddForm && (<AddRoomForm onSaved={() => { loadRooms(), setShowAddForm(false) }} onCancel={() => setShowAddForm(false)} />)}

                    </div>

                    <select value={listStatus} onChange={e => setListStatus(e.target.value as Status)}>
                        <option value="all">Todos</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>

                    {visibleRooms.map(room => (
                        <div key={room.id} className="room-item">
                            <div className={`room-card ${room.active ? '' : 'inactive'}`}>

                                <div className="room-info">
                                    <h3>{room.name}</h3>
                                </div>
                                <div className="form-update">
                                    {room.active && (
                                        <a
                                            className="download-link"
                                            href={`/api/rooms/${room.id}/qrcode`}
                                            download={`qrcode-${room.name}.png`}
                                        >
                                            Baixar QR Code
                                        </a>
                                    )}
                                    <label className="switch" title={room.active ? 'Desativar' : 'Ativar'}>
                                        <input
                                            type="checkbox"
                                            checked={room.active}
                                            onChange={() => toggleActive(room)}
                                        />
                                        <span className="slider" />
                                    </label>

                                    <button type="button" onClick={() => setEditingId(editingId === room.id ? null : room.id)}>
                                        {editingId === room.id ? 'Fechar' : 'Editar'}
                                    </button>
                                </div>


                            </div>


                            {editingId === room.id && (
                                <div className="room-edit">
                                    <UpdateRoomForm
                                        room={room}
                                        onSaved={() => {
                                            setEditingId(null)
                                            loadRooms()
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