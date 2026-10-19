import { AdminPage } from './admin/AdminPage'
import { ClientPage } from './client/ClientPage'

export function App() {
  const path = window.location.pathname
  const roomId = new URLSearchParams(window.location.search).get('room')

  if (path.startsWith('/admin')) return <AdminPage />
  if (path.startsWith('/kitchen')) return <KitchenPage />
  if (roomId) return <ClientPage roomId={roomId} />

  return <HomePage />
}