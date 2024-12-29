const WS_URL = 'ws://localhost:8080/ws'

export const connectWebSocket = () => {
  const ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    console.log('WebSocket Connected')
  }

  ws.onclose = (event) => {
    console.log('WebSocket Disconnected:', event.reason)
    setTimeout(() => {
      console.log('Attempting to reconnect...')
      connectWebSocket()
    }, 1000)
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log('Received:', data)
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  }

  return ws
}
