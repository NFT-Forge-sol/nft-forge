import { useState, useEffect } from 'react'
import { connectWebSocket } from '../../Services/websocketService'
import { Card, Image, Button, CardFooter } from '@nextui-org/react'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'

export default function Marketplace() {
  const [candyMachines, setCandyMachines] = useState([])
  const [ws, setWs] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const websocket = connectWebSocket()
    setWs(websocket)

    websocket.onopen = () => {
      websocket.send(JSON.stringify({ type: 'GET_CANDY_MACHINES' }))
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'CANDY_MACHINES_LIST') {
          console.log('CANDY_MACHINES_LIST', data.payload)
          setCandyMachines(data.payload)
        } else if (data.type === 'CANDY_MACHINE_CREATED') {
          setCandyMachines((prev) => [data.payload, ...prev])
        } else if (data.type === 'MINTED_COUNT_UPDATED') {
          setCandyMachines((prev) =>
            prev.map((machine) => (machine.candyMachineId === data.payload.candyMachineId ? data.payload : machine))
          )
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [])

  const getTimeLeft = (goLiveDate) => {
    if (!goLiveDate) return null
    const now = new Date().getTime()
    const startTime = new Date(goLiveDate).getTime()
    const timeLeft = startTime - now

    if (timeLeft <= 0) return 'LIVE'

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">NFT Marketplace</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candyMachines.map((machine) => (
          <div
            key={machine.candyMachineId}
            className="group relative h-[400px] rounded-lg overflow-hidden cursor-pointer border-2 border-orange-500/50 hover:border-orange-500 transition-colors duration-300"
            onClick={() => navigate(`/collection/${machine.candyMachineId}`)}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-300 group-hover:opacity-40"
              style={{
                backgroundImage: `url(${machine.metadata?.image || 'default-image-url.jpg'})`,
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-50 transition-opacity duration-300 group-hover:bg-black/70" />

            <div className="absolute inset-x-0 bottom-0 p-6 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">{machine.name}</h3>
                <p className="text-gray-300 text-sm uppercase tracking-wider">
                  {machine.collectionType || 'HOT COLLECTION'}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      getTimeLeft(machine.goLiveDate) === 'LIVE' ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                  />
                  <span className="text-white font-medium">{getTimeLeft(machine.goLiveDate)}</span>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">{machine.name}</h3>
                <p className="text-gray-300">{machine.metadata?.description || 'No description available'}</p>
                <Button
                  onPress={() => useNavigate('collection/' + machine.metadata.candyMachineId)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                  radius="sm"
                >
                  Explore Collection
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
