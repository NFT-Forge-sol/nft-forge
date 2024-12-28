const express = require('express')
const http = require('http')
const cors = require('cors')
const setupWebSocketServer = require('./websocket')

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)

// Setup WebSocket
const wss = setupWebSocketServer(server)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`)
})
