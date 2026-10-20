import {  useState } from "react"
import { uploadImage } from "../../uploadImage"
import { FoodDTO } from "../../../shared/foodDTO"

type UpdateFoodFormProps = {
    food: FoodDTO
    onSaved: () => void
    onCancel: () => void
}
export function UpdateFoodForm(props: UpdateFoodFormProps) {


    const [name, setName] = useState(props.food.name)
    const [description, setDescription] = useState(props.food.description ?? '')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [status, setStatus] = useState(props.food.active)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        let imageUrl: string | null = null
        if (imageFile === null) {
            imageUrl = props.food.imageUrl
        } else {
            imageUrl = await uploadImage(imageFile)
            if (!imageUrl) {
                alert('Não foi possível enviar a imagem.')
                return
            }
        }

        const res = await fetch('/api/foods/' + props.food.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description: description || null, active: status, imageUrl }),
        })

        if (!res.ok) {
            alert('Não foi possível atualizar o alimento.')
            return
        }

        props.onSaved()
    }




    return (

        <div className="form-add">
            <form className="form-add" onSubmit={handleSubmit}>
                <h3>Atualizar alimento</h3>

                <label>
                    Nome
                    <input type="text" value={name} maxLength={80} required
                        onChange={e => setName(e.target.value)} />
                </label>

                <label>
                    Descrição
                    <input type="text" value={description} maxLength={80}
                        onChange={e => setDescription(e.target.value)} />
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

                <label>
                    Imagem
                    <input type="file" accept="image/*"
                        onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
                </label>

                <button type="submit">Salvar</button>
                <button type="button" onClick={props.onCancel}>Cancelar</button>
            </form>
        </div>




    )
}