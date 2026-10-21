import express from 'express'
import multer from 'multer'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { requireAdmin } from './auth/adminAuth'
import { AppError } from './errors'
import { foodRouter } from './food/foodRoutes'
import { ordersRouter } from './orders/ordersRoutes'
import { roomsRouter } from './rooms/roomsRoutes'
import { uploadsRouter } from './uploads/uploadRoutes'

export const app = express()

const webDir = [path.join(process.cwd(), 'web'), path.join(process.cwd(), 'dist/web')]
    .find(dir => existsSync(path.join(dir, 'index.html')))

app.use(express.json())
app.use('/uploads', express.static('uploads'))

if (webDir) {
    app.use(express.static(webDir))
}

app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong' })
})

app.use('/api/uploads', uploadsRouter)
app.use('/api/foods', foodRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/orders', ordersRouter)

if (webDir) {
    app.use('/admin', requireAdmin)

    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next()
        }
        res.sendFile(path.join(webDir, 'index.html'))
    })
}

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message })
    }

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Arquivo inválido ou maior que 2 MB' })
    }

    console.error(err.stack)
    res.status(500).json({ error: 'Internal Server Error' })
})