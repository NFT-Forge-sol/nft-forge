import { useState } from 'react'
import { Button, Input, Form } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'
import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js'
import FileInput from './FileInput'

const ProjectForm = () => {
  const [imageName, setImageName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [metadata, setMetadata] = useState([])
  const [mintedNft, setMintedNft] = useState(null)

  const { wallet, publicKey } = useWallet()

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

  const uploadToPinata = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:5000/api/upload-to-pinata', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`)
      }

      const data = await response.json()
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
    } catch (error) {
      console.error(error)
      throw new Error('Failed to upload file to Pinata.')
    }
  }

  const mintProgrammableNft = async (metadataUri, name, sellerFee, symbol, creators) => {
    setStatus('Connecting to Solana devnet...')
    const SOLANA_CONNECTION = new Connection(clusterApiUrl('devnet'))
    const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(wallet.adapter))

    console.log('Wallet PublicKey: ', publicKey.toBase58())
    setStatus('Minting NFT...')

    const transactionBuilder = await METAPLEX.nfts().builders().create({
      uri: metadataUri,
      name: name,
      sellerFeeBasisPoints: sellerFee,
      symbol: symbol,
      creators: creators,
      isMutable: true,
      isCollection: false,
    })

    const { signature, confirmResponse } = await METAPLEX.rpc().sendAndConfirmTransaction(transactionBuilder)

    if (confirmResponse.value.err) {
      throw new Error('Failed to confirm transaction.')
    }

    const { mintAddress } = transactionBuilder.getContext()
    console.log(`   Success!🎉`)
    console.log(`   Minted NFT: https://explorer.solana.com/address/${mintAddress.toString()}?cluster=devnet`)
    console.log(`   Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`)
    setMintedNft(mintAddress)
  }

  const uploadAndCreateNFT = async () => {
    if (!imageName || !symbol || !file) {
      setError('Please fill in all fields and upload a valid image!')
      return
    }

    if (!publicKey) {
      setError('Please connect your wallet!')
      return
    }

    console.log('WALLET: ', wallet)
    console.log('PUBLIC KEY : ', publicKey)

    try {
      setStatus('Uploading image to IPFS...')

      // Upload the image to Pinata
      const imageUri = await uploadToPinata(file)

      setStatus('Uploading metadata to IPFS...')
      const metadataObj = {
        name: imageName,
        description: 'This is an NFT on Solana',
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
      const metadataUri = await uploadToPinata(metadataFile)

      setStatus('Creating and Minting NFT...')

      const creators = [{ address: wallet.adapter.publicKey, share: 100 }]

      await mintProgrammableNft(metadataUri, imageName, 500, symbol, creators)
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
        label="Symbol"
        placeholder="Enter symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
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
