import express from 'express'

const app = express()

app.use(express.json())
app.use(express.static('public'))

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' })
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

const PORT = Number(process.env.PORT) || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})