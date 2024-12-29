import { useState, useEffect } from 'react'
import websocketService from '../../Services/websocketService'

export default function Marketplace() {
  const [candyMachines, setCandyMachines] = useState([])

  useEffect(() => {
    websocketService.connect()

    const unsubscribe = websocketService.subscribe((data) => {
      if (data.type === 'initCandyMachines') {
        setCandyMachines(data.candyMachines)
      } else if (data.type === 'newCandyMachine') {
        setCandyMachines((prev) => {
          const exists = prev.some((machine) => machine.id === data.candyMachine.id)
          if (!exists) {
            return [...prev, data.candyMachine]
          }
          return prev
        })
      }
    })

    return () => {
      unsubscribe()
      websocketService.disconnect()
    }
  }, [])

  const createFakeCandyMachine = () => {
    const fakeCandyMachine = {
      id: Date.now(),
      name: `Candy Machine ${Math.floor(Math.random() * 1000)}`,
      price: (Math.random() * 10).toFixed(2),
      supply: Math.floor(Math.random() * 100),
      minted: 0,
      image: `https://picsum.photos/200/200?random=${Date.now()}`,
    }

    if (websocketService.ws && websocketService.ws.readyState === WebSocket.OPEN) {
      websocketService.ws.send(
        JSON.stringify({
          type: 'newCandyMachine',
          candyMachine: fakeCandyMachine,
        })
      )
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">NFT Marketplace</h1>
        <button
          onClick={createFakeCandyMachine}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Fake Candy Machine
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candyMachines.map((machine) => (
          <div key={machine.id} className="border rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
            <img src={machine.image} alt={machine.name} className="w-full h-48 object-cover rounded-lg mb-4" />
            <h2 className="text-xl font-semibold mb-2">{machine.name}</h2>
            <div className="flex justify-between text-gray-600">
              <span>Price: {machine.price} SOL</span>
              <span>
                Supply: {machine.minted}/{machine.supply}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
