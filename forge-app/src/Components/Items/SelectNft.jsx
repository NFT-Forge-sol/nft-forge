import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { Button, Spinner } from '@nextui-org/react'

const SelectNft = ({ onNftSelect, selectedCollection }) => {
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedNft, setSelectedNft] = useState(null)
  const [addStatus, setAddStatus] = useState({ type: '', message: '' })
  const { publicKey, wallet } = useWallet()

  useEffect(() => {
    const fetchNfts = async () => {
      if (!publicKey) return

      try {
        setLoading(true)
        const connection = new Connection(clusterApiUrl('devnet'))
        const metaplex = new Metaplex(connection)

        const ownerNfts = await metaplex.nfts().findAllByOwner({ owner: publicKey })

        const filteredNfts = ownerNfts.filter((nft) => !nft.collectionDetails)

        const nftData = await Promise.all(
          filteredNfts.map(async (nft) => {
            try {
              const response = await fetch(nft.uri)
              const metadata = await response.json()
              return {
                address: nft.address.toString(),
                name: nft.name,
                symbol: nft.symbol,
                uri: nft.uri,
                image: metadata.image,
              }
            } catch (error) {
              console.error('Error fetching metadata for NFT:', error)
              return {
                address: nft.address.toString(),
                name: nft.name,
                symbol: nft.symbol,
                uri: nft.uri,
                image: null,
              }
            }
          })
        )

        console.log(nftData)
        setNfts(nftData)
      } catch (error) {
        console.error('Error fetching NFTs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNfts()
  }, [publicKey, selectedCollection])

  const handleNftSelect = (nft) => {
    setSelectedNft(nft)
  }

  const handleAddToCollection = async () => {
    if (!selectedNft || !selectedCollection || !wallet) {
      console.log('Missing required data')
      return
    }

    try {
      setLoading(true)
      setAddStatus({ type: 'loading', message: 'Adding NFT to collection...' })

      const connection = new Connection(clusterApiUrl('devnet'))
      const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter))

      const nftMint = new PublicKey(selectedNft.address)
      const collectionMint = new PublicKey(selectedCollection.mintAddress)

      const nft = await metaplex.nfts().findByMint({
        mintAddress: collectionMint,
      })

      console.log('Calling verifyCollection...')
      await metaplex.nfts().verifyCollection({
        mintAddress: nftMint,
        collectionMintAddress: collectionMint,
        isSizedCollection: true,
        collectionAuthority: new PublicKey(nft.updateAuthorityAddress),
      })

      console.log('NFT successfully added to collection!')
      setAddStatus({ type: 'success', message: 'NFT successfully added to collection!' })

      if (onNftSelect) {
        onNftSelect(selectedNft)
      }
    } catch (error) {
      console.error('Error adding NFT to collection:', error)
      let errorMessage = error.message
      if (error.message.includes('Incorrect account owner')) {
        errorMessage = 'Current wallet is not authorized to modify this collection'
      }
      setAddStatus({
        type: 'error',
        message: `Failed to add NFT: ${errorMessage}`,
      })
    } finally {
      setLoading(false)
      setTimeout(() => {
        setAddStatus({ type: '', message: '' })
      }, 5000)
    }
  }

  if (!publicKey) {
    return <div>Please connect your wallet to view NFTs</div>
  }

  if (loading) {
    return <div>Loading your NFTs...</div>
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Select an NFT</h2>

      {addStatus.message && (
        <div
          className={`mb-4 p-3 rounded ${
            addStatus.type === 'loading'
              ? 'bg-blue-100 text-blue-700'
              : addStatus.type === 'success'
              ? 'bg-green-100 text-green-700'
              : addStatus.type === 'error'
              ? 'bg-red-100 text-red-700'
              : ''
          }`}
        >
          <div className="flex items-center gap-2">
            {addStatus.type === 'loading' && <Spinner size="sm" />}
            {addStatus.message}
          </div>
        </div>
      )}

      {nfts.length === 0 ? (
        <div>No NFTs found in your wallet</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div
                key={nft.address}
                className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedNft?.address === nft.address ? 'border-blue-500 border-2' : ''
                }`}
                onClick={() => handleNftSelect(nft)}
              >
                <h3 className="font-semibold">{nft.name}</h3>
                {nft.image ? (
                  <img src={nft.image} alt={nft.name} className="w-full h-auto max-h-48 object-contain" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">No image available</div>
                )}
                <p className="text-sm text-gray-600">{nft.symbol}</p>
                <p className="text-xs text-gray-500 truncate">{nft.address}</p>
              </div>
            ))}
          </div>
          {selectedNft && (
            <div className="mt-4">
              <Button
                color="primary"
                onPress={handleAddToCollection}
                disabled={loading || addStatus.type === 'loading'}
              >
                {loading || addStatus.type === 'loading' ? (
                  <Spinner size="sm" color="currentColor" />
                ) : (
                  'Add NFT to Collection'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SelectNft
