import { useState } from 'react'
import { Button, Input, Form } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection } from '@solana/web3.js'
import { actions } from '@metaplex/js'
import FileInput from './FileInput'

const ProjectForm = () => {
  const [imageName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [imageLink, setImageLink] = useState('')
  const [imageBuffer, setImageBuffer] = useState(null)
  const [metadata, setMetadata] = useState([]) // Liste des métadonnées

  const { publicKey, wallet } = useWallet()

  const handleFileChange = (file) => {
    setFile(file)
    if (file) {
      setFileName(file.name)
      setError('')
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageBuffer(reader.result)
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleAddMetadata = () => {
    setMetadata([...metadata, { key: '', value: '' }])
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

  const mintNFT = async () => {
    if (!imageName || !description || !file || !publicKey) {
      setError('Please fill in all fields and upload a valid image!')
      return
    }

    setStatus('Uploading image to Pinata...')
    try {
      const pinataResponse = await uploadToPinata(file)
      const imageUri = `https://gateway.pinata.cloud/ipfs/${pinataResponse.IpfsHash}`
      setImageLink(imageUri)

      setStatus('Minting NFT...')
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      const metadataObj = {
        name: imageName,
        description: description,
        image: imageUri,
        attributes: metadata,
      }

      const nftMint = await actions.createNFT({
        connection,
        wallet,
        metadata: metadataObj,
      })

      setStatus('NFT minted successfully!')
      console.log('NFT Minted: ', nftMint)
    } catch (error) {
      setStatus('Minting failed: ' + error.message)
    }
  }

  const handleSubmit = async () => {
    if (!imageName || !description || !file) {
      setError('Please fill in all fields and upload a valid image!')
      return
    }

    await mintNFT()
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
        onChange={(e) => setProjectName(e.target.value)}
        required
      />

      <Input
        className="mt-3"
        type="text"
        label="Image Description"
        placeholder="Enter image description"
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
              label="Key"
              placeholder="Enter metadata key"
              value={meta.key}
              onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
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
        Generate Project + Mint NFT
      </Button>
      {status && <p>{status}</p>}
      {publicKey && <p>Connected with PublicKey: {publicKey.toBase58()}</p>}
      {imageLink && (
        <a href={imageLink} target="_blank" rel="noopener noreferrer">
          View Uploaded Image
        </a>
      )}
    </Form>
  )
}

export default ProjectForm
