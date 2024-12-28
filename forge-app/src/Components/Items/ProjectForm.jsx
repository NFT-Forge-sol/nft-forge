import { useState, useEffect } from 'react'
import { Button, Input, Form } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Metaplex, keypairIdentity, walletAdapterIdentity } from '@metaplex-foundation/js'
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import DatabaseProvider from '../../Database/DatabaseProvider'
import FileInput from './FileInput'

const ProjectForm = () => {
  const [imageName, setImageName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [metadata, setMetadata] = useState([])
  const [mintedNft, setMintedNft] = useState(null)
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)

  const { wallet, publicKey } = useWallet()

  useEffect(() => {
    const fetchCollections = async () => {
      if (!publicKey) return

      try {
        const connection = new Connection(clusterApiUrl('devnet'))
        const metaplex = new Metaplex(connection)

        const ownerNfts = await metaplex.nfts().findAllByOwner({ owner: publicKey })
        const userCollections = ownerNfts.filter((nft) => nft.collectionDetails)

        setCollections(
          userCollections.map((collection) => ({
            address: collection.address.toString(),
            name: collection.name,
            mintAddress: collection.mintAddress.toString(),
          }))
        )
      } catch (error) {
        console.error('Error fetching collections:', error)
      }
    }

    fetchCollections()
  }, [publicKey])

  const handleFileChange = (file) => {
    setFile(file)
    if (file) {
      setError('')
    }
  }

  const handleAddMetadata = () => {
    setMetadata([...metadata, { trait_type: '', value: '' }])
  }

  const handleMetadataChange = (index, type, value) => {
    const newMetadata = [...metadata]
    newMetadata[index][type] = value
    setMetadata(newMetadata)
  }

  const handleRemoveMetadata = (index) => {
    setMetadata(metadata.filter((_, i) => i !== index))
  }

  const mintProgrammableNft = async (metadataUri, name, sellerFee, symbol, creators) => {
    setStatus('Connecting to Solana devnet...')
    const SOLANA_CONNECTION = new Connection(clusterApiUrl('devnet'))
    const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(
      walletAdapterIdentity({
        publicKey: publicKey,
        signTransaction: wallet.adapter.signTransaction.bind(wallet.adapter),
        signAllTransactions: wallet.adapter.signAllTransactions.bind(wallet.adapter),
        signMessage: wallet.adapter.signMessage?.bind(wallet.adapter),
      })
    )

    try {
      const nftSettings = {
        uri: metadataUri,
        name: name,
        sellerFeeBasisPoints: sellerFee,
        symbol: symbol,
        creators: creators,
        isMutable: true,
        isCollection: false,
      }

      if (selectedCollection) {
        nftSettings.collection = new PublicKey(selectedCollection.mintAddress)
      }

      const { nft } = await METAPLEX.nfts().create(nftSettings)

      if (selectedCollection) {
        setStatus('Verifying NFT as part of collection...')
        await METAPLEX.nfts().verifyCollection({
          mintAddress: nft.address,
          collectionMintAddress: new PublicKey(selectedCollection.mintAddress),
          isSizedCollection: true,
        })
      }

      console.log(`Success!🎉`)
      console.log(`Minted NFT: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`)
      setMintedNft(nft.address)
    } catch (error) {
      console.error('Minting error:', error)
      setStatus('Minting failed: ' + error.message)
      throw error
    }
  }

  const uploadAndCreateNFT = async () => {
    if (!imageName || !description || !file) {
      setError('Please fill in all fields and upload a valid image!')
      return
    }

    if (!publicKey) {
      setError('Please connect your wallet!')
      return
    }

    try {
      setStatus('Uploading image to IPFS...')

      // Upload the image to Pinata
      const imageUri = await DatabaseProvider.uploadToPinata(file)

      setStatus('Uploading metadata to IPFS...')
      const metadataObj = {
        name: imageName,
        description: description,
        image: imageUri,
        external_url: 'https://example.com',
        attributes: metadata,
        properties: {
          files: [
            {
              uri: imageUri,
              type: file.type,
            },
          ],
          category: 'image',
        },
      }

      const metadataBlob = new Blob([JSON.stringify(metadataObj)], { type: 'application/json' })
      const metadataFile = new File([metadataBlob], 'metadata.json')
      const metadataUri = await DatabaseProvider.uploadToPinata(metadataFile)

      setStatus('Creating and Minting NFT...')

      const creators = [{ address: publicKey, share: 100 }]

      await mintProgrammableNft(metadataUri, imageName, 500, description, creators)
    } catch (error) {
      console.error('Error:', error)
      setStatus('Minting failed: ' + error.message)
    }
  }

  const handleSubmit = async () => {
    await uploadAndCreateNFT()
  }

  return (
    <Form>
      <FileInput onFileChange={handleFileChange} />

      <div className="mt-3">
        <select
          className="w-full p-2 border rounded"
          onChange={(e) => setSelectedCollection(collections.find((c) => c.address === e.target.value))}
          value={selectedCollection?.address || ''}
        >
          <option value="">Select a Collection (Optional)</option>
          {collections.map((collection) => (
            <option key={collection.address} value={collection.address}>
              {collection.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        className="mt-3"
        type="text"
        label="Project Name"
        placeholder="Enter project name"
        value={imageName}
        onChange={(e) => setImageName(e.target.value)}
        required
      />

      <Input
        className="mt-3"
        type="text"
        label="Description"
        placeholder="Enter description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <div className="mt-5">
        <h4>Metadata</h4>
        <Button className="mt-3" onPress={handleAddMetadata}>
          Add Metadata
        </Button>
        {metadata.map((meta, index) => (
          <div key={index} className="flex gap-3 mt-3 items-center">
            <Input
              fullWidth
              type="text"
              label="Trait Type"
              placeholder="Enter metadata trait type"
              value={meta.trait_type}
              onChange={(e) => handleMetadataChange(index, 'trait_type', e.target.value)}
            />
            <Input
              fullWidth
              type="text"
              label="Value"
              placeholder="Enter metadata value"
              value={meta.value}
              onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
            />
            <Button color="error" auto onPress={() => handleRemoveMetadata(index)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <Button className="mt-3" onPress={handleSubmit}>
        Create and Mint NFT
      </Button>
      {status && <p>{status}</p>}
      {mintedNft && (
        <div>
          <h4>Minted NFT:</h4>
          <pre>{JSON.stringify(mintedNft, null, 2)}</pre>
        </div>
      )}
    </Form>
  )
}

export default ProjectForm
