import React, { useState } from 'react'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button, Input, Form } from '@nextui-org/react'
import FileInput from './FileInput'
import DatabaseProvider from '../../Database/DatabaseProvider'

const CollectionForm = () => {
  const [collectionName, setCollectionName] = useState('')
  const [collectionDescription, setCollectionDescription] = useState('')
  const [collectionSymbol, setCollectionSymbol] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { wallet } = useWallet()

  const handleFileChange = (file) => {
    setFile(file)
    if (file) {
      setError('')
    }
  }

  const handleCreateCollection = async () => {
    if (!wallet?.adapter?.publicKey) {
      setError('Please connect your wallet first!')
      setSuccess('')
      return
    }

    if (!collectionName) {
      setError('Please fill in the collection name!')
      setSuccess('')
      return
    }

    if (!file) {
      setError('Please upload a collection image!')
      setSuccess('')
      return
    }

    try {
      setError('')
      console.log('Starting collection creation process...')

      const imageUri = await DatabaseProvider.uploadToPinata(file)
      console.log('Image uploaded:', imageUri)

      const metadataUri = await DatabaseProvider.uploadToPinata(
        new Blob(
          [
            JSON.stringify({
              name: collectionName,
              symbol: collectionSymbol,
              description: collectionDescription,
              image: imageUri,
            }),
          ],
          { type: 'application/json' }
        )
      )
      console.log('Metadata uploaded:', metadataUri)

      const connection = new Connection(clusterApiUrl('devnet'))
      const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter))

      const walletPublicKey = new PublicKey(wallet.adapter.publicKey.toBase58())

      console.log('Creating collection NFT...')
      const { nft: collectionNft } = await metaplex.nfts().create({
        uri: metadataUri,
        name: collectionName,
        symbol: collectionSymbol,
        sellerFeeBasisPoints: 500,
        isCollection: true,
        creators: [
          {
            address: walletPublicKey,
            share: 100,
            verified: false,
          },
        ],
        collection: null,
        uses: null,
      })

      console.log('Collection NFT created:', collectionNft.address.toBase58())

      console.log('Updating collection authority...')
      await metaplex.nfts().update({
        nftOrSft: collectionNft,
        newAuthority: walletPublicKey,
        newUpdateAuthority: walletPublicKey,
      })

      const verifiedNft = await metaplex.nfts().findByMint({ mintAddress: collectionNft.address })
      console.log('Collection verified:', verifiedNft.address.toBase58())
      console.log('Collection authority:', verifiedNft.updateAuthorityAddress.toBase58())

      setSuccess(`Collection created! Mint address: ${collectionNft.address.toBase58()}`)
      setError('')
      setCollectionName('')
      setCollectionDescription('')
      setCollectionSymbol('')
      setFile(null)
    } catch (e) {
      console.error('Collection creation error:', e)
      let errorMessage = e.message
      if (e.name === 'AccountNotFoundError') {
        errorMessage = 'Failed to create collection. Please ensure you have enough SOL in your wallet and try again.'
      }
      setError(`Error creating collection: ${errorMessage}`)
      setSuccess('')
    }
  }

  return (
    <div className="pr-[50px] pt-[20px]">
      <Form>
        <Input
          fullWidth
          clearable
          label="Collection Name"
          placeholder="Enter collection name"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
        />
        <Input
          fullWidth
          clearable
          label="Collection Symbol"
          placeholder="Enter collection symbol"
          value={collectionSymbol}
          onChange={(e) => setCollectionSymbol(e.target.value)}
        />
        <Input
          fullWidth
          clearable
          label="Collection Description"
          placeholder="Enter collection description"
          value={collectionDescription}
          onChange={(e) => setCollectionDescription(e.target.value)}
        />
        <FileInput onFileChange={handleFileChange} />
        <Button onPress={handleCreateCollection} style={{ marginTop: '20px' }}>
          Create Collection
        </Button>
      </Form>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginTop: '10px' }}>{success}</p>}
    </div>
  )
}

export default CollectionForm
