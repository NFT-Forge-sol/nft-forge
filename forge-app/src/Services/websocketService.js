class WebSocketService {
  constructor() {
    this.ws = null
    this.subscribers = new Set()
  }

  connect() {
    const wsUrl = 'ws://localhost:8080'
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('Connected to WebSocket')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.notifySubscribers(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket')
      setTimeout(() => this.connect(), 5000)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  notifySubscribers(data) {
    this.subscribers.forEach((callback) => callback(data))
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

const websocketService = new WebSocketService()
export default websocketService
