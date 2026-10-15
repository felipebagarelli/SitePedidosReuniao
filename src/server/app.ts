import express from 'express'
import { foodRouter } from './food/foodRoutes'
import { roomsRouter } from './rooms/roomsRoutes'
import { ordersRouter } from './orders/ordersRoutes'
import { AppError } from './errors'



export const app = express()

app.use(express.json())
app.use(express.static('public'))

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' })
})

app.use('/api/foods', foodRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/orders', ordersRouter)

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})