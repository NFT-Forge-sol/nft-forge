const WebSocket = require('ws')

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server })

  wss.on('connection', (ws) => {
    console.log('New client connected')

    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message)
        console.log('Received:', parsedMessage)

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

    ws.send(JSON.stringify({ type: 'connection', status: 'connected' }))
  })

  return wss
}

module.exports = setupWebSocketServer
