import { useState, useEffect } from 'react'
import { connectWebSocket } from '../../Services/websocketService'
import { Card, Image, Button, Input } from '@nextui-org/react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Marketplace() {
  const [candyMachines, setCandyMachines] = useState([])
  const [ws, setWs] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    price: {
      min: '',
      max: '',
    },
    status: {
      live: true,
      upcoming: true,
    },
    itemsAvailable: {
      min: '',
      max: '',
    },
  })
  const [expandedFilters, setExpandedFilters] = useState({
    price: false,
    status: false,
    itemsAvailable: false,
  })
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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

  const resetFilters = () => {
    setFilters({
      price: { min: '', max: '' },
      status: { live: true, upcoming: true },
      itemsAvailable: { min: '', max: '' },
    })
    setSearchQuery('')
  }

  const filteredMachines = candyMachines.filter((machine) => {
    const matchesSearch = machine.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPrice =
      (!filters.price.min || machine.price >= Number(filters.price.min)) &&
      (!filters.price.max || machine.price <= Number(filters.price.max))
    const matchesStatus =
      (filters.status.live && getTimeLeft(machine.goLiveDate) === 'LIVE') ||
      (filters.status.upcoming && getTimeLeft(machine.goLiveDate) !== 'LIVE')
    const matchesItems =
      (!filters.itemsAvailable.min || machine.itemsAvailable >= Number(filters.itemsAvailable.min)) &&
      (!filters.itemsAvailable.max || machine.itemsAvailable <= Number(filters.itemsAvailable.max))

    return matchesSearch && matchesPrice && matchesStatus && matchesItems
  })

  const toggleFilter = (filterType) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }))
  }

  return (
    <div className="flex min-h-screen">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : -320 }}
        transition={{ type: 'spring', bounce: 0.2 }}
        className="fixed md:sticky top-0 left-0 w-80 h-screen bg-forge-400/50 backdrop-blur-md border-r border-primary-500/20 p-6 z-50"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Filters</h2>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() =>
              setFilters({
                price: { min: '', max: '' },
                status: { live: true, upcoming: true },
                itemsAvailable: { min: '', max: '' },
              })
            }
          >
            <X onPress={() => setIsSidebarOpen(false)} size={20} />
          </Button>
        </div>

        <div className="mb-6">
          <button
            className="flex justify-between items-center w-full text-left font-semibold mb-2"
            onClick={() => toggleFilter('price')}
          >
            <span>Price Range</span>
            {expandedFilters.price ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <AnimatePresence>
            {expandedFilters.price && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-2">
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={filters.price.min}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        price: { ...prev.price, min: e.target.value },
                      }))
                    }
                    size="sm"
                    className="bg-forge-300/50"
                  />
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={filters.price.max}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        price: { ...prev.price, max: e.target.value },
                      }))
                    }
                    size="sm"
                    className="bg-forge-300/50"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <button
            className="flex justify-between items-center w-full text-left font-semibold mb-2"
            onClick={() => toggleFilter('status')}
          >
            <span>Status</span>
            {expandedFilters.status ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <AnimatePresence>
            {expandedFilters.status && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.live}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: { ...prev.status, live: e.target.checked },
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span>Live</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.upcoming}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: { ...prev.status, upcoming: e.target.checked },
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span>Upcoming</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Items Available Filter */}
        <div className="mb-6">
          <button
            className="flex justify-between items-center w-full text-left font-semibold mb-2"
            onClick={() => toggleFilter('itemsAvailable')}
          >
            <span>Items Available</span>
            {expandedFilters.itemsAvailable ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <AnimatePresence>
            {expandedFilters.itemsAvailable && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-2">
                  <Input
                    type="number"
                    placeholder="Min Items"
                    value={filters.itemsAvailable.min}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        itemsAvailable: { ...prev.itemsAvailable, min: e.target.value },
                      }))
                    }
                    size="sm"
                    className="bg-forge-300/50"
                  />
                  <Input
                    type="number"
                    placeholder="Max Items"
                    value={filters.itemsAvailable.max}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        itemsAvailable: { ...prev.itemsAvailable, max: e.target.value },
                      }))
                    }
                    size="sm"
                    className="bg-forge-300/50"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="flex-1 p-6">
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search size={20} />}
            className="flex-1 max-w-md"
          />
          <Button
            className="md:hidden bg-forge-400/50 hover:bg-forge-300"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Filter size={20} />
          </Button>
        </div>

        {/* Grid of Collections or No Results Message */}
        {filteredMachines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMachines.map((machine) => (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-forge-400/50 backdrop-blur-md border border-primary-500/20 rounded-lg p-8 text-center">
              <h3 className="text-xl font-bold mb-2">No Collections Found</h3>
              <p className="text-gray-400 mb-4">We couldn't find any collections matching your current filters.</p>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onPress={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
