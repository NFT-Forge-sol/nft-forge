import { useState, useEffect } from 'react'
import { Input, Button, Switch, Card, Spinner, Select, SelectItem } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { create, mplCandyMachine, addConfigLines } from '@metaplex-foundation/mpl-candy-machine'
import { generateSigner, none, publicKey, sol, some, transactionBuilder } from '@metaplex-foundation/umi'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import {
  fetchAllDigitalAssetByOwner,
  mplTokenMetadata,
  TokenMetadataProgram,
} from '@metaplex-foundation/mpl-token-metadata'
import DatabaseProvider from '../../Database/DatabaseProvider'
import JSZip from 'jszip'
import { connectWebSocket } from '../../Services/websocketService'

export default function CandyMachine() {
  const { publicKey: walletPublicKey, wallet } = useWallet()
  const [formData, setFormData] = useState({
    price: 1,
    itemsAvailable: 100,
    sellerFeeBasisPoints: 250,
    maxEditionSupply: 0,
    isMutable: true,
    goLiveDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  })

  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [nftFiles, setNftFiles] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [candyMachineId, setCandyMachineId] = useState(null)
  const [processedFiles, setProcessedFiles] = useState([])
  const [ws, setWs] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadingNFTs, setIsUploadingNFTs] = useState(false)

  useEffect(() => {
    if (walletPublicKey && wallet) {
      fetchCollections()
    }
  }, [walletPublicKey, wallet])

  useEffect(() => {
    const websocket = connectWebSocket()
    setWs(websocket)

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [])

  const fetchCollections = async () => {
    try {
      setIsLoading(true)
      const umi = createUmi(clusterApiUrl('devnet'))
        .use(walletAdapterIdentity(wallet.adapter))
        .use(mplCandyMachine())
        .use(mplTokenMetadata())

      const myNfts = await fetchAllDigitalAssetByOwner(umi, publicKey(walletPublicKey))

      console.log(myNfts)

      const myCollections = myNfts.filter(
        (nft) =>
          nft.metadata.collectionDetails?.value?.__kind === 'V1' ||
          nft.metadata.collectionDetails?.value?.__kind === 'V2'
      )

      console.log('Found collections:', myCollections)
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
    try {
      const zipFile = e.target.files[0]
      if (!zipFile || !zipFile.name.endsWith('.zip')) {
        alert('Please upload a ZIP file')
        return
      }

      const zip = new JSZip()
      const contents = await zip.loadAsync(zipFile)
      const processedItems = []

      const fileEntries = Object.entries(contents.files)

      const sortedFiles = fileEntries.sort(([nameA], [nameB]) => nameA.localeCompare(nameB))

      for (let i = 0; i < sortedFiles.length; i += 2) {
        const jsonFile = sortedFiles[i][1]
        const imageFile = sortedFiles[i + 1][1]

        if (!jsonFile.name.endsWith('.json') || !imageFile.name.endsWith('.png')) {
          console.error('Invalid file pair:', jsonFile.name, imageFile.name)
          continue
        }

        const metadata = JSON.parse(await jsonFile.async('text'))

        const imageBlob = await imageFile.async('blob')
        const imageFile2 = new File([imageBlob], imageFile.name, { type: 'image/png' })

        processedItems.push({
          metadata,
          image: imageFile2,
        })
      }

      console.log('Processed files:', processedItems)

      setProcessedFiles(processedItems)
      setNftFiles(processedItems)
    } catch (error) {
      console.error('Error processing ZIP file:', error)
      alert('Error processing ZIP file. Please check the console for details.')
    }
  }

  const uploadNFTsToDatabase = async (candyMachineId, processedFiles, umi) => {
    try {
      setIsUploadingNFTs(true)
      const totalFiles = processedFiles.length
      const nftUris = []
      const configLines = []

      for (let i = 0; i < processedFiles.length; i++) {
        const { metadata, image } = processedFiles[i]

        const imageUrl = await DatabaseProvider.uploadToPinata(image)

        const updatedMetadata = {
          ...metadata,
          image: imageUrl,
        }

        const metadataBlob = new Blob([JSON.stringify(updatedMetadata)], { type: 'application/json' })
        const metadataUrl = await DatabaseProvider.uploadToPinata(metadataBlob)

        nftUris.push(metadataUrl)

        configLines.push({
          name: metadata.name,
          uri: metadataUrl,
        })

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      const batchSize = 10
      for (let i = 0; i < configLines.length; i += batchSize) {
        const batch = configLines.slice(i, i + batchSize)

        const tx = transactionBuilder().add(
          addConfigLines(umi, {
            candyMachine: publicKey(candyMachineId),
            index: i,
            configLines: batch,
          })
        )

        await tx.sendAndConfirm(umi)

        setUploadProgress(Math.round((Math.min(i + batchSize, configLines.length) / totalFiles) * 100))
      }

      console.log('All NFTs uploaded and added to Candy Machine successfully')
      return nftUris
    } catch (error) {
      console.error('Error uploading NFTs:', error)
      throw error
    } finally {
      setIsUploadingNFTs(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!walletPublicKey || !wallet || !selectedCollection) {
      alert('Please connect your wallet and select a collection')
      return
    }

    if (!processedFiles.length) {
      alert('Please upload NFT files')
      return
    }

    try {
      setIsUploading(true)

      const metadataResponse = await fetch(selectedCollection.metadata.uri)
      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch metadata from URI')
      }
      const metadata = await metadataResponse.json()

      const umi = createUmi(clusterApiUrl('devnet')).use(walletAdapterIdentity(wallet.adapter)).use(mplCandyMachine())

      console.log('Creating candy machine...')

      const candyMachine = generateSigner(umi)

      await (
        await create(umi, {
          candyMachine,
          collectionMint: publicKey(selectedCollection.mint.publicKey),
          collectionUpdateAuthority: publicKey(wallet.adapter.publicKey),
          tokenStandard: 0,
          sellerFeeBasisPoints: { basisPoints: formData.sellerFeeBasisPoints },
          itemsAvailable: BigInt(formData.itemsAvailable),
          creators: [
            {
              address: publicKey(wallet.adapter.publicKey),
              percentageShare: formData.sellerFeeBasisPoints,
              verified: true,
            },
          ],
          configLineSettings: some({
            prefixName: '',
            nameLength: 32,
            prefixUri: '',
            uriLength: 200,
            isSequential: false,
          }),
          guards: {
            botTax: none(),
            solPayment: some({
              lamports: sol(formData.price),
              destination: publicKey(wallet.adapter.publicKey),
            }),
            startDate: some({
              date: BigInt(new Date(formData.goLiveDate).getTime() / 1000),
            }),
            endDate: none(),
            mintLimit: none(),
            nftBurn: none(),
            nftGate: none(),
            nftPayment: none(),
            redeemedAmount: none(),
            tokenBurn: none(),
            tokenGate: none(),
            tokenPayment: none(),
            freezeSolPayment: none(),
            freezeTokenPayment: none(),
            programGate: none(),
            allocation: none(),
            allowList: none(),
          },
        })
      ).sendAndConfirm(umi)

      console.log('Candy Machine created:', candyMachine.publicKey.toString())

      await uploadNFTsToDatabase(candyMachine.publicKey.toString(), processedFiles, umi)

      const candyMachineData = DatabaseProvider.formatCandyMachineData({
        address: candyMachine.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        price: formData.price,
        itemsAvailable: formData.itemsAvailable,
        creatorAddress: wallet.adapter.publicKey,
        goLiveDate: formData.goLiveDate,
        description: metadata.description,
        image: metadata.image,
        externalUrl: metadata.external_url,
        attributes: metadata.attributes,
      })

      await DatabaseProvider.createCandyMachine(candyMachineData)

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'CANDY_MACHINE_CREATED',
          })
        )
      }

      setCandyMachineId(candyMachine.publicKey.toString())
      alert('Candy Machine created successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert(`Failed to create Candy Machine: ${error.message}`)
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
              required
              selectedKeys={selectedCollection ? [selectedCollection.mint.publicKey.toString()] : []}
              onChange={(e) => {
                const collection = collections.find((c) => c.mint.publicKey.toString() === e.target.value)
                setSelectedCollection(collection)
              }}
            >
              {collections.map((collection) => (
                <SelectItem key={collection.mint.publicKey.toString()} value={collection.mint.publicKey.toString()}>
                  {collection.metadata.name}
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
              description="Total number of unique NFTs in your collection"
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
              description="Number of copies allowed per NFT (0 for unique NFTs)"
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
              <Input
                type="file"
                accept=".zip"
                onChange={handleNFTsUpload}
                className="w-full"
                required
                disabled={isUploadingNFTs}
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload a ZIP file containing your NFT images and metadata. Format inside ZIP: 0.png, 0.json, 1.png,
                1.json etc...
              </p>
            </div>

            {/* Add upload progress indicator */}
            {isUploadingNFTs && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uploading NFTs...</span>
                  <span className="text-sm">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              color="primary"
              className="w-full"
              disabled={!publicKey || isUploading || isUploadingNFTs}
            >
              {isUploading || isUploadingNFTs ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>{isUploadingNFTs ? 'Uploading NFTs...' : 'Creating...'}</span>
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
