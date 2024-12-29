import React, { useState } from 'react'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js'
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
      const METAPLEX = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter))

      const walletPublicKey = new PublicKey(wallet.adapter.publicKey.toBase58())

      console.log('Creating collection NFT...')
      const { nft: collectionNft } = await METAPLEX.nfts().create({
        uri: metadataUri,
        name: collectionName,
        symbol: collectionSymbol,
        sellerFeeBasisPoints: 500,
        isCollection: true,
        creators: [
          {
            address: walletPublicKey,
            share: 100,
            verified: true,
          },
        ],
      })

      console.log('Collection NFT created:', collectionNft.address.toBase58())

      /*console.log('Updating collection authority...')
      const updateInstructions = METAPLEX.nfts().builders().update({
        nftOrSft: collectionNft,
        newAuthority: walletPublicKey,
        newUpdateAuthority: walletPublicKey,
      })

      console.log('Approving collection authority...')
      const approveInstructions = METAPLEX.nfts().builders().approveCollectionAuthority({
        mintAddress: collectionNft.address,
        collectionAuthority: walletPublicKey,
      })

      console.log('Verifying collection...')
      const verifyInstructions = METAPLEX.nfts().builders().verifyCollection({
        mintAddress: collectionNft.address,
        collectionAuthority: walletPublicKey,
        isSizedCollection: true,
        collectionMintAddress: collectionNft.address,
      })

      console.log('Sending transaction...')
      const transaction = new Transaction()
      transaction.add(...updateInstructions.getInstructions())
      transaction.add(...approveInstructions.getInstructions())

      const latestBlockhash = await METAPLEX.connection.getLatestBlockhash()
      transaction.recentBlockhash = latestBlockhash.blockhash
      transaction.feePayer = walletPublicKey

      console.log('Signing transaction...')
      const signature = await wallet.adapter.sendTransaction(transaction, METAPLEX.connection)
      await METAPLEX.connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      })*/

      const verifiedNft = await METAPLEX.nfts().findByMint({ mintAddress: collectionNft.address })
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
