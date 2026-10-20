import {  useState } from "react"
import { uploadImage } from "../../uploadImage"

type AddFoodFormProps = {
    onSaved: () => void
    onCancel: () => void
}
export function AddFoodForm(props: AddFoodFormProps) {


    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        let imageUrl: string | null = null
        if (imageFile) {
            imageUrl = await uploadImage(imageFile)
            if (!imageUrl) {
                alert('Não foi possível enviar a imagem.')
                return
            }
        }

        const res = await fetch('/api/foods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description: description || null, active: true, imageUrl }),
        })

        if (!res.ok) {
            alert('Não foi possível cadastrar o alimento.')
            return
        }

        props.onSaved()
    }




    return (

        <div className="form-add">
            <form className="form-add" onSubmit={handleSubmit}>
                <h3>Adicionar alimento</h3>

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