import {  useState } from "react"
import { RoomDTO } from "../../../shared/roomsDTO"

type UpdateRoomFormProps = {
    room: RoomDTO
    onSaved: () => void
    onCancel: () => void
}
export function UpdateRoomForm(props: UpdateRoomFormProps) {


    const [name, setName] = useState(props.room.name)
    const [status, setStatus] = useState(props.room.active)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()


        const res = await fetch('/api/rooms/' + props.room.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, active: status}),
        })

        if (!res.ok) {
            alert('Não foi possível atualizar a sala.')
            return
        }

        props.onSaved()
    }




    return (

        <div className="form-add">
            <form className="form-add" onSubmit={handleSubmit}>
                <h3>Atualizar sala</h3>

                <label>
                    Nome
                    <input type="text" value={name} maxLength={80} required
                        onChange={e => setName(e.target.value)} />
                </label>

                <label className="switch">
                    <input
                        type="checkbox"
                        checked={status}
                        onChange={e => setStatus(e.target.checked)}
                    />
                    <span className="slider" />
                    {status ? 'Ativo' : 'Inativo'}
                </label>

                <button type="submit">Salvar</button>
                <button type="button" onClick={props.onCancel}>Cancelar</button>
            </form>
        </div>




    )
}