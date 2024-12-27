import React, { useState, useEffect } from 'react'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { clusterApiUrl, Connection } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button, Spinner } from '@nextui-org/react'

const CollectionsWallet = ({ onCollectionSelect }) => {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCollection, setSelectedCollection] = useState(null)

  const { wallet } = useWallet()

  const fetchCollections = async () => {
    if (!wallet?.adapter?.publicKey) {
      setError('Please connect your wallet.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const connection = new Connection(clusterApiUrl('devnet'))
      const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter))

      const nfts = await metaplex.nfts().findAllByOwner({ owner: wallet.adapter.publicKey })

      const collections = nfts.filter(
        (nft) =>
          nft.collectionDetails && nft.collectionDetails.size !== undefined && nft.collectionDetails.version === 'V1'
      )

      setCollections(collections)
    } catch (e) {
      setError(`Error fetching collections: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (wallet?.adapter?.connected) {
      fetchCollections()
    }
  }, [wallet?.adapter?.connected])

  const handleCollectionSelect = (collection) => {
    setSelectedCollection(collection)
    if (onCollectionSelect) {
      onCollectionSelect(collection)
    }
  }

  return (
    <div className="pt-[50px]">
      <Button onPress={fetchCollections} disabled={loading} className="mb-4">
        {loading ? <Spinner size="sm" /> : 'Fetch Collections'}
      </Button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        {collections.length > 0 ? (
          <ul>
            {collections.map((collection, index) => (
              <li
                key={index}
                className={`mb-4 p-4 border rounded cursor-pointer hover:bg-gray-100 ${
                  selectedCollection?.mintAddress.toBase58() === collection.mintAddress.toBase58()
                    ? 'border-blue-500 border-2'
                    : ''
                }`}
                onClick={() => handleCollectionSelect(collection)}
              >
                <p>
                  <strong>Name:</strong> {collection.name || 'Unnamed Collection'}
                </p>
                <p>
                  <strong>Mint Address:</strong> {collection.mintAddress.toBase58()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p>No collections found.</p>
        )}
      </div>
    </div>
  )
}

export default CollectionsWallet
