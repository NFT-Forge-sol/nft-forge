import React, { useState, useEffect } from 'react'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { clusterApiUrl, Connection } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button, Spinner } from '@nextui-org/react'

const CollectionsWallet = () => {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      console.log(collections)
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
              <li key={index} className="mb-4">
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
