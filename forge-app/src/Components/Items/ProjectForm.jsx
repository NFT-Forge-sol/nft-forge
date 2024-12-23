import { useState } from 'react'
import { Button, Input, Form } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { createProgrammableNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { generateSigner, percentAmount, signerIdentity } from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { base58 } from '@metaplex-foundation/umi/serializers'
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

  const createAndMintNFT = async () => {
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

      // Initialisation de umi
      const umi = createUmi('https://api.devnet.solana.com').use(mplTokenMetadata())

      // Création du signer et ajout de signerIdentity
      const signer = generateSigner(umi)
      umi.use(signerIdentity(signer))

      const balance = await umi.rpc.getBalance(publicKey)
      console.log(`Balance: ${balance.basisPoints} lamparts`)

      // Airdrop to wallet for testing | Remove on production
      // await umi.rpc.airdrop(publicKey, sol(1))

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

      const tx = await createProgrammableNft(umi, {
        mint: signer,
        sellerFeeBasisPoints: 550, // 5.5%
        name: imageName,
        uri: metadataUri,
      }).sendAndConfirm(umi)

      const signature = base58.deserialize(tx.signature)[0]
      setMintedNft(signer.publicKey)
      setStatus('NFT minted successfully!')

      console.log('\npNFT Created')
      console.log('View Transaction on Solana Explorer')
      console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)
      console.log('\n')
      console.log('View NFT on Metaplex Explorer')
      console.log(`https://explorer.solana.com/address/${nftSigner.publicKey}?cluster=devnet`)
    } catch (error) {
      console.error('Error:', error)
      setStatus('Minting failed: ' + error.message)
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
