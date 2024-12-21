import { useState } from 'react'
import { Button, Input, Form } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js'
import FileInput from './FileInput'
import { Buffer } from 'buffer/'

const ProjectForm = () => {
  const [imageName, setImageName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [imageLink, setImageLink] = useState('')
  const [metadata, setMetadata] = useState([])
  const [mintedNft, setMintedNft] = useState(null)

  const { publicKey, wallet } = useWallet()

  const handleFileChange = (file) => {
    setFile(file)
    if (file) {
      setFileName(file.name)
      setError('')
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageLink(reader.result)
      }
      reader.readAsDataURL(file)
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
        throw new Error('Failed to upload to Pinata')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Upload to Pinata failed:', error)
      throw error
    }
  }

  const createAndMintNFT = async () => {
    if (!imageName || !symbol || !file) {
      setError('Please fill in all fields and upload a valid image!')
      return
    }

    if (!publicKey) {
      setError('Please connect your wallet!')
      return
    }

    setStatus('Uploading image to Pinata...')
    try {
      const pinataResponse = await uploadToPinata(file)
      const imageUri = `https://gateway.pinata.cloud/ipfs/${pinataResponse.IpfsHash}`
      setImageLink(imageUri)

      setStatus('Creating and Minting NFT...')
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const metaplex = Metaplex.make(connection)
      metaplex.use(keypairIdentity(wallet.adapter.secretKey))

      const { nft } = await metaplex.nfts().create({
        uri: imageUri,
        name: imageName,
        symbol: symbol,
        sellerFeeBasisPoints: 500, // 5% royalties
        creators: [
          {
            address: publicKey,
            share: 100,
          },
        ],
        maxSupply: 1,
        isMutable: true,
      })

      setMintedNft(nft)
      setStatus('NFT minted successfully!')
      console.log('NFT Minted:', nft)
    } catch (error) {
      setStatus('Minting failed: ' + error.message)
      console.error(error)
    }
  }

  const handleSubmit = async () => {
    await createAndMintNFT()
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
      {publicKey && <p>Connected with PublicKey: {publicKey.toBase58()}</p>}
      {imageLink && (
        <a href={imageLink} target="_blank" rel="noopener noreferrer">
          View Uploaded Image
        </a>
      )}
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
