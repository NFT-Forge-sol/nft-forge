import { useState, useEffect, useRef } from 'react'
import { Input, Card, Button, Chip, Spinner } from '@nextui-org/react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import DatabaseProvider from '../../Database/DatabaseProvider'

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('')
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const scrollContainerRef = useRef(null)

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
      const scrollAmount = 400 // Adjust this value based on your card width
      const container = scrollContainerRef.current
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    <div className="min-h-screen w-full">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search size={20} />}
              className="max-w-md"
            />
          </div>
        </div>
      </div>

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
            {filteredCollections.map((collection) => {
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

                    {/* Card Content */}
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
    </div>
  )
}
