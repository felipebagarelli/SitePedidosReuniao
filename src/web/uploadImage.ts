export async function uploadImage(file: File): Promise<string | null> {
    const body = new FormData()
    body.append('image', file)

    const res = await fetch('/api/uploads', { method: 'POST', body })
    if (!res.ok) return null

    const data = await res.json()
    return data.url
}