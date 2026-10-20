import { useState } from "react";
import { FoodDTO } from "../../shared/foodDTO";
import { FoodTab } from "./foodTab/FoodTab";
import { RoomsTab } from "./roomTab/RoomsTab";
import './admin.css'

type Tab = 'foods' | 'rooms' | 'qrcodes'

export function AdminPage() {
    const [errorMessage, setErrorMessage] = useState('')
    const [tab, setTab] = useState<Tab>('foods')

    /*





PRECISO AINDA COLOCAR OS PROPS, PRECISO CONFIGURAR 
O ENVIO DE IMAGENS NO BACKEND E AQUI TAMBEM


*/


    return (
        <div className="admin-page">
            <header>
                <img src="/images/logo/logo.png" alt="Logo" />
                <h1>Administração</h1>
            </header>

            <nav className="tabs">
                <button className={tab === 'rooms' ? 'active' : ''} onClick={() => setTab('rooms')}>Salas</button>
                <button className={tab === 'foods' ? 'active' : ''} onClick={() => setTab('foods')}>Alimentos</button>
                <button className={tab === 'qrcodes' ? 'active' : ''} onClick={() => setTab('qrcodes')}>QR Codes</button>
            </nav>

            <main>
                {tab === 'rooms' && <RoomsTab />}
                {tab === 'foods' && <FoodTab />}
                {tab === 'qrcodes' && <QrCodesTab />}
            </main>
        </div>
    )
    
}