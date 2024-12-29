import { useState, useEffect } from 'react'
import { connectWebSocket } from '../../Services/websocketService'

export default function Marketplace() {
  const [candyMachines, setCandyMachines] = useState([])
  const [ws, setWs] = useState(null)
  const [timeLeft, setTimeLeft] = useState({})

  const calculateTimeLeft = (goLiveDate) => {
    const difference = new Date(goLiveDate) - new Date()

    if (difference <= 0) {
      return null
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = {}
      candyMachines.forEach((machine) => {
        newTimeLeft[machine.candyMachineId] = calculateTimeLeft(machine.goLiveDate)
      })
      setTimeLeft(newTimeLeft)
    }, 1000)

    return () => clearInterval(timer)
  }, [candyMachines])

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
          setCandyMachines((prev) => [...prev, data.payload])
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">NFT Marketplace</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candyMachines.map((machine) => (
          <div
            key={machine.candyMachineId}
            className="border rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
          >
            <img
              src={machine.metadata?.image || 'default-image-url.jpg'}
              alt={machine.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h2 className="text-xl font-semibold mb-2">{machine.name}</h2>
            <div className="flex justify-between text-gray-600 mb-4">
              <span>Price: {machine.price} SOL</span>
              <span>
                Minted: {machine.mintedCount}/{machine.itemsAvailable}
              </span>
            </div>

            <div className="mt-4">
              {timeLeft[machine.candyMachineId] ? (
                <div className="text-center mb-2">
                  <p className="text-sm text-gray-600">Time until launch:</p>
                  <p className="font-medium">
                    {timeLeft[machine.candyMachineId].days}d {timeLeft[machine.candyMachineId].hours}h{' '}
                    {timeLeft[machine.candyMachineId].minutes}m {timeLeft[machine.candyMachineId].seconds}s
                  </p>
                </div>
              ) : null}

              <button
                className={`w-full py-2 px-4 rounded-lg ${
                  timeLeft[machine.candyMachineId] ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-semibold transition-colors`}
                disabled={!!timeLeft[machine.candyMachineId]}
                onClick={() => {
                  /* Add mint function here */
                }}
              >
                {timeLeft[machine.candyMachineId] ? 'Not Live Yet' : 'Mint NFT'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
