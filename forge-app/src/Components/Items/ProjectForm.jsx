import React, { useState, useEffect } from 'react'
import { Button, Input, Form } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, Keypair, SystemProgram, Transaction } from '@solana/web3.js'
import { actions } from '@metaplex/js'
import FileInput from './FileInput'

const ProjectForm = () => {
  const [projectName, setProjectName] = useState('')
  const [symbol, setSymbol] = useState('') // Nouvelle variable d'état pour le symbole
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [imageBuffer, setImageBuffer] = useState(null)

  const { publicKey, connected, wallet } = useWallet()

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

  const mintNFT = async () => {
    if (!projectName || !symbol || !file || !publicKey || !imageBuffer) {
      setError('Please fill in all fields and upload a valid image!')
      return
    }

    setStatus('Minting NFT...')

    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

      const metadata = {
        name: projectName,
        symbol: symbol,
        uri: 'https://your-metadata-uri.com',
        creators: [],
      }

      const nftMint = await actions.createNFT({
        connection,
        wallet,
        metadata,
        buffer: imageBuffer,
      })

      setStatus('NFT minted successfully!')
      console.log('NFT Minted: ', nftMint)
    } catch (error) {
      setStatus('Minting failed: ' + error.message)
    }
  }

  const handleSubmit = async () => {
    if (!projectName || !symbol || !file) {
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
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        required
      />

      <Input
        className="mt-3"
        type="text"
        label="Project Symbol"
        placeholder="Enter project symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        required
      />

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <Button className="mt-3" onPress={handleSubmit}>
        Generate Project + Mint NFT
      </Button>
      {status && <p>{status}</p>}
      {publicKey && <p>Connected with PublicKey: {publicKey.toBase58()}</p>}
    </Form>
  )
}

export default ProjectForm
