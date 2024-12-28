import { useState, useEffect } from 'react'
import { Input, Button, Switch, Card, Spinner, Select, SelectItem } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import DatabaseProvider from '../../Database/DatabaseProvider'

export default function CandyMachine() {
  const { publicKey, wallet } = useWallet()
  const [formData, setFormData] = useState({
    price: 1,
    itemsAvailable: 100,
    symbol: '',
    sellerFeeBasisPoints: 250,
    maxEditionSupply: 0,
    isMutable: true,
    goLiveDate: new Date().toISOString().slice(0, 16),
  })

  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [nftFiles, setNftFiles] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [candyMachineId, setCandyMachineId] = useState(null)

  useEffect(() => {
    if (publicKey && wallet) {
      fetchCollections()
    }
  }, [publicKey, wallet])

  const fetchCollections = async () => {
    try {
      setIsLoading(true)
      const connection = new Connection(clusterApiUrl('devnet'))
      const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter))

      const myNfts = await metaplex.nfts().findAllByOwner({ owner: publicKey })

      const myCollections = myNfts.filter(
        (nft) =>
          nft.collectionDetails?.version === 'V1' || // Collection NFTs
          nft.collectionDetails?.version === 'V2'
      )

      setCollections(myCollections)
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleCollectionUpload = async (e) => {
    const file = e.target.files[0]
    setCollectionNFT(file)
  }

  const handleNFTsUpload = async (e) => {
    const files = e.target.files
    setNftFiles(files)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!publicKey || !wallet || !selectedCollection) {
      alert('Please connect your wallet and select a collection')
      return
    }

    try {
      setIsUploading(true)

      const connection = new Connection(clusterApiUrl('devnet'))
      const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter))

      const { candyMachine } = await metaplex.candyMachines().create({
        itemsAvailable: formData.itemsAvailable,
        sellerFeeBasisPoints: formData.sellerFeeBasisPoints,
        price: formData.price,
        symbol: formData.symbol,
        maxEditionSupply: formData.maxEditionSupply,
        isMutable: formData.isMutable,
        creators: [
          {
            address: publicKey,
            share: 100,
          },
        ],
        collection: {
          address: selectedCollection.address,
          updateAuthority: publicKey,
        },
        goLiveDate: new Date(formData.goLiveDate),
      })

      const candyMachineData = {
        ...formData,
        candyMachineId: candyMachine.address.toString(),
        creatorAddress: publicKey.toString(),
        collectionAddress: selectedCollection.address.toString(),
      }

      await DatabaseProvider.createCandyMachine(candyMachineData)
      setCandyMachineId(candyMachine.address.toString())

      if (nftFiles && nftFiles.length > 0) {
        const items = []
        for (let i = 0; i < nftFiles.length; i++) {
          const uri = await DatabaseProvider.uploadToPinata(nftFiles[i])
          items.push({
            name: `${selectedCollection.name} #${i + 1}`,
            uri: uri,
            sellerFeeBasisPoints: formData.sellerFeeBasisPoints,
          })
        }

        await metaplex.candyMachines().update({
          candyMachine,
          items: items,
        })
      }

      alert('Candy Machine created successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create Candy Machine')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Your Candy Machine</h1>

      <Card className="p-6 bg-black/40">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Select Collection"
              placeholder={isLoading ? 'Loading collections...' : 'Select a collection'}
              className="w-full"
              isDisabled={isLoading || collections.length === 0}
              onChange={(e) => {
                const collection = collections.find((c) => c.address.toString() === e.target.value)
                setSelectedCollection(collection)
              }}
            >
              {collections.map((collection) => (
                <SelectItem key={collection.address.toString()} value={collection.address.toString()}>
                  {collection.name}
                </SelectItem>
              ))}
            </Select>

            <Input
              type="number"
              label="Price (SOL)"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min={0}
              step={0.01}
              required
              className="w-full"
            />

            <Input
              type="number"
              label="Items Available"
              name="itemsAvailable"
              value={formData.itemsAvailable}
              onChange={handleInputChange}
              min={1}
              required
              className="w-full"
            />

            <Input
              type="text"
              label="Symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              placeholder="MYNFT"
              required
              className="w-full"
            />

            <Input
              type="number"
              label="Seller Fee (basis points)"
              name="sellerFeeBasisPoints"
              value={formData.sellerFeeBasisPoints}
              onChange={handleInputChange}
              min={0}
              max={10000}
              required
              className="w-full"
              description="100 = 1%"
            />

            <Input
              type="number"
              label="Max Edition Supply"
              name="maxEditionSupply"
              value={formData.maxEditionSupply}
              onChange={handleInputChange}
              min={0}
              required
              className="w-full"
            />

            <Input
              type="datetime-local"
              label="Go Live Date & Time"
              name="goLiveDate"
              value={formData.goLiveDate}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">NFT Files </label>
              <Input type="file" accept=".zip" onChange={handleNFTsUpload} className="w-full" required />
              <p className="text-xs text-gray-400 mt-1">
                Upload a ZIP file containing your NFT images and metadata. Format inside ZIP: 0.png, 0.json, 1.png,
                1.json etc...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" color="primary" className="w-full" disabled={!publicKey || isUploading}>
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Candy Machine'
              )}
            </Button>
          </div>

          {!publicKey && (
            <p className="text-warning text-sm text-center">Please connect your wallet to create a Candy Machine</p>
          )}
        </form>
      </Card>

      {candyMachineId && (
        <div className="mt-6 p-4 bg-success/20 rounded-lg">
          <p className="text-success">Candy Machine created successfully! ID: {candyMachineId}</p>
        </div>
      )}
    </div>
  )
}
