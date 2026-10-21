import {  useState } from "react"

type AddRoomFormProps = {
    onSaved: () => void
    onCancel: () => void
}
export function AddRoomForm(props: AddRoomFormProps) {


    const [name, setName] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const res = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, active: true}),
        })

        if (!res.ok) {
            alert('Não foi possível cadastrar a sala.')
            return
        }

        props.onSaved()
    }




    return (

        <div className="form-add">
            <form className="form-add" onSubmit={handleSubmit}>
                <h3>Adicionar sala</h3>

                <label>
                    Nome
                    <input type="text" value={name} maxLength={80} required
                        onChange={e => setName(e.target.value)} />
                </label>
                
                <button type="submit">Salvar</button>
                <button type="button" onClick={props.onCancel}>Cancelar</button>
            </form>
        </div>




    )
}