import React, { useState } from 'react'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { clusterApiUrl, Connection } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button, Input, Form } from '@nextui-org/react'
import FileInput from './FileInput'
import { uploadFile } from '../Tools/ApiProvider'

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
      const imageUri = await uploadFile(file)

      const metadataUri = await uploadFile(
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

      const connection = new Connection(clusterApiUrl('devnet'))
      const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter))

      const { mintAddress } = await metaplex.nfts().create({
        uri: metadataUri,
        name: collectionName,
        symbol: collectionSymbol,
        sellerFeeBasisPoints: 500,
        isCollection: true,
      })

      setSuccess(`Collection created! Mint address: ${mintAddress.toBase58()}`)
      setError('')
      setCollectionName('')
      setCollectionDescription('')
      setCollectionSymbol('')
      setFile(null)
    } catch (e) {
      setError(`Error creating collection: ${e.message}`)
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
