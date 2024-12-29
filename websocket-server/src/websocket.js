import { WebSocketServer, WebSocket } from 'ws'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

if (!process.env.MONGO_DB_USER || !process.env.MONGO_DB_PASSWORD) {
  console.error('Missing MongoDB credentials in environment variables')
  process.exit(1)
}

const MONGODB_URI = `mongodb+srv://${encodeURIComponent(process.env.MONGO_DB_USER)}:${encodeURIComponent(
  process.env.MONGO_DB_PASSWORD
)}@${process.env.MONGO_DB_CLUSTER}/${process.env.MONGO_DB_DATABASE}?retryWrites=true&w=majority`

const candyMachineSchema = new mongoose.Schema({
  candyMachineId: { type: String, required: true, unique: true },
  name: String,
  symbol: String,
  price: Number,
  itemsAvailable: Number,
  creatorAddress: String,
  goLiveDate: Date,
  image: String,
  externalUrl: String,
  attributes: [Object],
  description: String,
  metadata: {
    description: String,
    image: String,
    external_url: String,
    attributes: [Object],
  },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'active' },
  mintedCount: { type: Number, default: 0 },
})

const CandyMachine = mongoose.model('CandyMachine', candyMachineSchema, process.env.MONGO_DB_COLLECTION)

async function setupWebSocketServer(server) {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    console.log('Connected to MongoDB Atlas')

    const wss = new WebSocketServer({
      server,
      path: '/ws',
    })

    wss.on('error', (error) => {
      console.error('WebSocket server error:', error)
    })

    wss.on('connection', (ws) => {
      console.log('New client connected')

      ws.send(JSON.stringify({ type: 'CONNECTION_SUCCESS' }))

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message)
          console.log('Received message:', data)

          switch (data.type) {
            case 'CANDY_MACHINE_CREATED':
              console.log('New candy machine created, refreshing lists...')
              try {
                const candyMachines = await CandyMachine.find({})
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(
                      JSON.stringify({
                        type: 'CANDY_MACHINES_LIST',
                        payload: candyMachines,
                      })
                    )
                  }
                })
              } catch (error) {
                console.error('Error fetching candy machines:', error)
                ws.send(
                  JSON.stringify({
                    type: 'ERROR',
                    payload: 'Failed to fetch candy machines',
                  })
                )
              }
              break

            case 'GET_CANDY_MACHINES':
              console.log('Fetching candy machines...')
              try {
                const candyMachines = await CandyMachine.find({})
                // Broadcast to all connected clients
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(
                      JSON.stringify({
                        type: 'CANDY_MACHINES_LIST',
                        payload: candyMachines,
                      })
                    )
                  }
                })
              } catch (error) {
                console.error('Error fetching candy machines:', error)
                ws.send(
                  JSON.stringify({
                    type: 'ERROR',
                    payload: 'Failed to fetch candy machines',
                  })
                )
              }
              break

            default:
              console.log('Unknown message type:', data.type)
              break
          }
        } catch (error) {
          console.error('Error processing message:', error)
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              payload: error.message,
            })
          )
        }
      })

      ws.on('error', (error) => {
        console.error('WebSocket connection error:', error)
      })

      ws.on('close', () => {
        console.log('Client disconnected')
      })
    })

    console.log('WebSocket server initialized')
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message)
    if (error.code === 8000) {
      console.error('Authentication failed. Please check your MongoDB credentials in .env file')
    }
    throw error
  }
}

export { setupWebSocketServer }
