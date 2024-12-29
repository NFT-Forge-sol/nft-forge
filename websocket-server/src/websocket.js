const WebSocket = require('ws')
const { initStorage, getAllCandyMachines, saveCandyMachine } = require('./storage')

async function setupWebSocketServer(server) {
  // Initialize storage
  await initStorage()

  const wss = new WebSocket.Server({ server })

  wss.on('connection', async (ws) => {
    console.log('New client connected')

    const existingCandyMachines = await getAllCandyMachines()
    ws.send(
      JSON.stringify({
        type: 'initCandyMachines',
        candyMachines: existingCandyMachines,
      })
    )

    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message)
        console.log('Received:', parsedMessage)

        if (parsedMessage.type === 'newCandyMachine') {
          await saveCandyMachine(parsedMessage.candyMachine)
        }

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(parsedMessage))
          }
        })
      } catch (error) {
        console.error('Error processing message:', error)
      }
    })

    ws.on('close', () => {
      console.log('Client disconnected')
    })
  })

  return wss
}

module.exports = setupWebSocketServer
