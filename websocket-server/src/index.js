import express from 'express'
import http from 'http'
import cors from 'cors'
import { setupWebSocketServer } from './websocket.js'

const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  })
)

const server = http.createServer(app)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

setupWebSocketServer(server)

const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
