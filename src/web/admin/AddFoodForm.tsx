import { useEffect, useState } from "react"
import { FoodDTO } from "../../shared/foodDTO"

export function AddFoodForm() {
/*





PRECISO AINDA COLOCAR OS PROPS, PRECISO CONFIGURAR 
O ENVIO DE IMAGENS NO BACKEND E AQUI TAMBEM


*/

    const [showAddForm, setShowAddForm] = useState(false)
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

        closeForm()
        await loadFoods()
    }

    function closeForm() {
        setShowAddForm(false)
        setName('')
        setDescription('')
        setImageFile(null)
    }


    return (
        
                <div className="form-add">
                    <h3>Adicionar Alimento</h3>
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
                        <button type="button" onClick={closeForm}>Cancelar</button>
                    </form>
                </div>


            

    )
}