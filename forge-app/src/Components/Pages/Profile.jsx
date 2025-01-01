import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button, Card, Image, Tabs, Tab, Spinner } from '@nextui-org/react'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { clusterApiUrl } from '@solana/web3.js'
import { fetchAllDigitalAssetByOwner } from '@metaplex-foundation/mpl-token-metadata'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { Copy, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router'

export default function Profile() {
  const { publicKey, wallet } = useWallet()
  const [nfts, setNfts] = useState([])
  const [collections, setCollections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState(null)
  const navigate = useNavigate()

  const fetchMetadata = async (uri) => {
    try {
      const response = await fetch(uri)
      const metadata = await response.json()
      return metadata
    } catch (error) {
      console.error('Error fetching metadata:', error)
      return null
    }
  }

  const processAssets = async (assets) => {
    const processedAssets = await Promise.all(
      assets.map(async (asset) => {
        const metadata = await fetchMetadata(asset.metadata.uri)
        return {
          ...asset,
          fullMetadata: metadata,
        }
      })
    )
    return processedAssets
  }

  const fetchNFTs = async () => {
    try {
      setIsLoading(true)
      const umi = createUmi(clusterApiUrl('devnet')).use(walletAdapterIdentity(wallet.adapter)).use(mplTokenMetadata())

      const assets = await fetchAllDigitalAssetByOwner(umi, publicKey)

      const processedAssets = await processAssets(assets)

      console.log(processedAssets)

      const collectionsArray = processedAssets.filter(
        (nft) =>
          nft.metadata.collectionDetails?.value?.__kind === 'V1' ||
          nft.metadata.collectionDetails?.value?.__kind === 'V2'
      )
      const nftsArray = processedAssets.filter((nft) => nft.metadata.collectionDetails.__option === 'None')

      setCollections(collectionsArray)
      setNfts(nftsArray)
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (publicKey && wallet) {
      fetchNFTs()
    }
  }, [publicKey, wallet])

  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey.toString())
  }

  const shortenAddress = (address) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-forge-400/50 backdrop-blur-md border border-primary-500/20 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Wallet Profile</h1>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">{shortenAddress(publicKey.toString())}</span>
              <Button isIconOnly size="sm" className="bg-forge-300/50 hover:bg-forge-300" onClick={copyAddress}>
                <Copy size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                className="bg-forge-300/50 hover:bg-forge-300"
                as="a"
                href={`https://solscan.io/account/${publicKey.toString()}?cluster=devnet`}
                target="_blank"
              >
                <ExternalLink size={16} />
              </Button>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Collections</p>
              <p className="text-xl font-bold">{collections.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">NFTs</p>
              <p className="text-xl font-bold">{nfts.length}</p>
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Spinner size="lg" color="primary" />
        </div>
      ) : (
        <Tabs
          aria-label="NFT Options"
          className="mb-6"
          classNames={{
            tabList: 'bg-forge-400/50 backdrop-blur-md border border-primary-500/20',
            cursor: 'bg-primary-500',
            tab: 'text-white',
            tabContent: 'group-data-[selected=true]:text-white',
          }}
        >
          <Tab key="nfts" title="NFTs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {nfts.map((nft) => (
                <div
                  key={nft.publicKey}
                  className="group relative h-[300px] rounded-lg overflow-hidden cursor-pointer border-2 border-orange-500/50 hover:border-orange-500 transition-colors duration-300"
                  onMouseEnter={() => setHoveredId(nft.publicKey)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                    style={{
                      backgroundImage: `url(${nft.fullMetadata?.image || '/placeholder.png'})`,
                      opacity: hoveredId === nft.publicKey ? 0.4 : 1,
                    }}
                  />

                  <div className="absolute inset-0 bg-black opacity-50" />

                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{nft.metadata.name}</h3>
                        <p className="text-sm text-gray-300">NFT</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute inset-x-0 bottom-0 p-4 transition-opacity duration-300"
                    style={{ opacity: hoveredId === nft.publicKey ? 1 : 0 }}
                  >
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-white">{nft.metadata.name}</h3>
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {nft.fullMetadata?.description || 'No description available'}
                      </p>
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm py-1"
                        radius="sm"
                      >
                        View NFT
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Tab>
          <Tab key="collections" title="Collections">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {collections.map((collection) => (
                <div
                  key={collection.publicKey}
                  className="group relative h-[300px] rounded-lg overflow-hidden cursor-pointer border-2 border-orange-500/50 hover:border-orange-500 transition-colors duration-300"
                  onMouseEnter={() => setHoveredId(collection.publicKey)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                    style={{
                      backgroundImage: `url(${collection.fullMetadata?.image || '/placeholder.png'})`,
                      opacity: hoveredId === collection.publicKey ? 0.4 : 1,
                    }}
                  />

                  <div className="absolute inset-0 bg-black opacity-50" />

                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{collection.metadata.name}</h3>
                        <p className="text-sm text-gray-300">Collection</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute inset-x-0 bottom-0 p-4 transition-opacity duration-300"
                    style={{ opacity: hoveredId === collection.publicKey ? 1 : 0 }}
                  >
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-white">{collection.metadata.name}</h3>
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {collection.fullMetadata?.description || 'No description available'}
                      </p>
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm py-1"
                        radius="sm"
                      >
                        View Collection
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Tab>
        </Tabs>
      )}
    </div>
  )
}
