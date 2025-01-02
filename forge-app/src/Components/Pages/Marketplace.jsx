import { useState, useEffect, useRef } from 'react'
import { Input, Card, Button, Chip, Spinner } from '@nextui-org/react'
import { Search, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import DatabaseProvider from '../../Database/DatabaseProvider'

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const scrollContainerRef = useRef(null)
  const searchRef = useRef(null)

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim()) {
      const results = collections.filter((collection) => collection.name.toLowerCase().includes(query.toLowerCase()))
      setSearchResults(results)
    } else {
      setSearchResults(collections)
    }
  }

  useEffect(() => {
    setSearchResults(collections)
  }, [collections])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true)
        const data = await DatabaseProvider.getAllCandyMachines()
        const sortedCollections = data.sort((a, b) => {
          const aIsUpcoming = new Date(a.goLiveDate) > new Date()
          const bIsUpcoming = new Date(b.goLiveDate) > new Date()
          if (aIsUpcoming && !bIsUpcoming) return -1
          if (!aIsUpcoming && bIsUpcoming) return 1
          return new Date(a.goLiveDate) - new Date(b.goLiveDate)
        })
        setCollections(sortedCollections)
      } catch (err) {
        console.error('Error fetching collections:', err)
        setError('Failed to load collections. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      const container = scrollContainerRef.current
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-danger">{error}</p>
          <Button className="mt-4" color="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative">
      {isSearchFocused && <div className="fixed inset-0 bg-black/80 z-40" />}

      <div className="relative z-50" ref={searchRef}>
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center">
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                startContent={<Search size={20} />}
                className="max-w-md"
                classNames={{
                  base: 'bg-forge-700 border-forge-600',
                  inputWrapper: 'bg-forge-700 border-forge-600 hover:bg-forge-600',
                }}
              />
            </div>
          </div>
        </div>

        {isSearchFocused && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-full max-w-3xl bg-forge-300/95 rounded-lg shadow-xl border border-forge-600 mt-2"
            style={{
              transform: 'translate(-50%, 0)',
              willChange: 'transform',
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-forge-600">
                <h3 className="text-lg font-semibold text-orange-500">Popular Collections</h3>
                <div className="flex gap-2">
                  {['All Chains', 'SOL', 'ETH', 'BTC'].map((chain) => (
                    <Button key={chain} size="sm" variant="flat" className="bg-forge-700 hover:bg-forge-600">
                      {chain}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {searchResults.map((collection) => (
                  <Link
                    key={collection.candyMachineId}
                    to={`/collection/${collection.candyMachineId}`}
                    className="flex items-center gap-4 p-4 bg-forge-700 hover:bg-forge-600 rounded-lg transition-colors"
                  >
                    <img
                      src={collection.metadata?.image}
                      alt={collection.name}
                      className="w-12 h-12 rounded-full object-cover border border-forge-500"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-400">{collection.name}</h4>
                      <p className="text-sm text-gray-300">
                        Floor: <span className="text-orange-300">{collection.price} SOL</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-300">
                        {collection.itemsMinted || 0}/{collection.itemsAvailable}
                      </p>
                      <p className="text-xs text-gray-300">Items</p>
                    </div>
                  </Link>
                ))}
              </div>

              <style>
                {`
                  @media (prefers-reduced-motion: no-preference) {
                    .custom-scrollbar {
                      scroll-behavior: smooth;
                    }
                  }
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                  }
                `}
              </style>
            </div>
          </div>
        )}
      </div>

      <div className={isSearchFocused ? 'pointer-events-none' : ''}>
        <div className="w-full bg-transparent">
          <div className="max-w-[100%] mx-auto space-y-6">
            <div className="flex justify-between items-center px-4">
              <h2 className="text-2xl font-bold">Featured Collections</h2>
              <div className="flex gap-2">
                <Button isIconOnly className="bg-forge-400/50 hover:bg-forge-300" onPress={() => scroll('left')}>
                  <ChevronLeft />
                </Button>
                <Button isIconOnly className="bg-forge-400/50 hover:bg-forge-300" onPress={() => scroll('right')}>
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div ref={scrollContainerRef} className="flex overflow-x-hidden gap-6 pb-4 scroll-smooth px-4">
              {collections.map((collection) => {
                const isUpcoming = new Date(collection.goLiveDate) > new Date()
                const itemsMinted = collection.itemsMinted || 0

                return (
                  <Link
                    key={collection.candyMachineId}
                    to={`/collection/${collection.candyMachineId}`}
                    className="flex-none w-[300px]"
                  >
                    <Card className="bg-forge-400/50 backdrop-blur-md border border-primary-500/20 hover:border-primary-500 transition-all duration-300">
                      {/* Card Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={collection.metadata?.image}
                          alt={collection.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Chip size="sm" className={`${isUpcoming ? 'bg-warning-500' : 'bg-success-500'} text-white`}>
                            {isUpcoming ? 'Upcoming' : 'Live'}
                          </Chip>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Chip size="sm" className="bg-default-100 text-white">
                            {collection.category || 'LAUNCHPAD'}
                          </Chip>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        <h3 className="font-bold text-lg line-clamp-1">{collection.name}</h3>

                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <p className="text-default-500">Price</p>
                            <p className="font-semibold">{collection.price} SOL</p>
                          </div>
                          <div className="text-right">
                            <p className="text-default-500">Items</p>
                            <p className="font-semibold">
                              {itemsMinted} / {collection.itemsAvailable}
                            </p>
                          </div>
                        </div>

                        {isUpcoming && (
                          <div className="text-center">
                            <p className="text-sm text-default-500">
                              Starts {new Date(collection.goLiveDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="w-full py-12">
          <div className="max-w-[90%] mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Collections Stats</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="flat" className="bg-forge-400/50">
                  24h
                </Button>
                <Button size="sm" variant="flat" className="bg-forge-400/50">
                  7d
                </Button>
                <Button size="sm" variant="flat" className="bg-forge-400/50">
                  30d
                </Button>
              </div>
            </div>

            {/* Collections Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-forge-300/20">
                    <th className="pb-4 pl-4">#</th>
                    <th className="pb-4">Collection</th>
                    <th className="pb-4">Floor</th>
                    <th className="pb-4">Items</th>
                    <th className="pb-4">Supply</th>
                    <th className="pb-4">Minted %</th>
                    <th className="pb-4">Creator</th>
                  </tr>
                </thead>
                <tbody>
                  {collections
                    .filter((collection) => new Date(collection.goLiveDate) <= new Date())
                    .map((collection, index) => {
                      const mintPercentage = (collection.itemsMinted / collection.itemsAvailable) * 100

                      return (
                        <tr
                          key={collection.candyMachineId}
                          className="border-b border-forge-300/20 hover:bg-forge-400/20 transition-colors"
                        >
                          <td className="py-4 pl-4">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-gray-500 cursor-pointer hover:text-yellow-500" />
                              {index + 1}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <img
                                src={collection.metadata?.image}
                                alt={collection.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <span className="font-semibold">{collection.name}</span>
                                <span className="text-xs text-gray-400 block">{collection.symbol}</span>
                              </div>
                            </div>
                          </td>
                          <td>{collection.price} SOL</td>
                          <td>{collection.itemsMinted || 0}</td>
                          <td>{collection.itemsAvailable}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-forge-600 rounded-full h-2">
                                <div
                                  className="bg-primary-500 h-2 rounded-full"
                                  style={{ width: `${mintPercentage}%` }}
                                />
                              </div>
                              <span>{mintPercentage.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td>
                            <Link
                              to={`/creator/${collection.creatorAddress}`}
                              className="text-sm font-mono text-primary-500 hover:text-primary-400 transition-colors"
                            >
                              {collection.creatorAddress.slice(0, 4)}...{collection.creatorAddress.slice(-4)}
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
