import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Button, Link, useDisclosure } from '@nextui-org/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  mplCandyMachine,
  mintFromCandyMachineV2,
  fetchCandyMachine,
  mintV2,
} from '@metaplex-foundation/mpl-candy-machine'
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox'
import { none, some, transactionBuilder } from '@metaplex-foundation/umi'
import { publicKey, generateSigner } from '@metaplex-foundation/umi'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { clusterApiUrl } from '@solana/web3.js'
import DatabaseProvider from '../../Database/DatabaseProvider'
import ColorThief from 'colorthief'
import { base58 } from '@metaplex-foundation/umi/serializers'

export default function Collection() {
  const { id } = useParams()
  const wallet = useWallet()
  const { connected } = wallet
  const [collection, setCollection] = useState(null)
  const [candyMachineData, setCandyMachineData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [gradientColors, setGradientColors] = useState(null)
  const [isMinting, setIsMinting] = useState(false)

  const umi = useMemo(() => {
    return createUmi(clusterApiUrl('devnet')).use(mplCandyMachine()).use(walletAdapterIdentity(wallet))
  }, [wallet])

  const isLive = useMemo(() => {
    if (!collection?.goLiveDate) return false
    return new Date(collection.goLiveDate).getTime() <= new Date().getTime()
  }, [collection?.goLiveDate])

  useEffect(() => {
    let isMounted = true

    const fetchCollection = async () => {
      try {
        const data = await DatabaseProvider.getCandyMachineById(id)
        if (isMounted) {
          setCollection(data)
          console.log(collection)
          setLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching collection:', error)
          setError(error.message || 'Failed to load collection data')
          setLoading(false)
        }
      }
    }

    fetchCollection()

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    if (!collection?.metadata?.image && !collection?.image) return

    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = collection.metadata?.image || collection.image

    const handleLoad = () => {
      try {
        const colorThief = new ColorThief()
        const palette = colorThief.getPalette(img, 2)
        const colors = palette.map(([r, g, b]) => `rgba(${r}, ${g}, ${b}, 0.5)`)
        setGradientColors(colors)
      } catch (error) {
        console.error('Error extracting colors:', error)
      }
    }

    img.addEventListener('load', handleLoad)
    return () => img.removeEventListener('load', handleLoad)
  }, [collection?.metadata?.image, collection?.image])

  useEffect(() => {
    if (!collection || !collection.goLiveDate || isLive) {
      return
    }

    let intervalId

    const updateTimer = () => {
      try {
        const now = new Date().getTime()
        const distance = new Date(collection.goLiveDate).getTime() - now

        if (distance < 0) {
          setTimeLeft(null)
          clearInterval(intervalId)
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24))
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((distance % (1000 * 60)) / 1000)
          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }
      } catch (error) {
        console.error('Error updating timer:', error)
        clearInterval(intervalId)
      }
    }

    updateTimer()
    intervalId = setInterval(updateTimer, 1000)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [collection, collection?.goLiveDate, isLive])

  useEffect(() => {
    const fetchCandyMachineData = async () => {
      try {
        const candyMachine = await fetchCandyMachine(umi, publicKey(id))
        console.log('Candy Machine Data:', candyMachine)
        setCandyMachineData(candyMachine)
      } catch (error) {
        console.error('Error fetching candy machine:', error)
      }
    }

    if (id) {
      fetchCandyMachineData()
    }
  }, [umi, id])

  const backgroundStyle = useMemo(
    () => ({
      background: gradientColors
        ? `radial-gradient(circle at top, ${gradientColors[0]}, ${gradientColors[1]}, transparent)`
        : 'none',
    }),
    [gradientColors]
  )

  const handleMint = async () => {
    if (!connected) {
      console.log('Please connect your wallet first')
      return
    }

    try {
      setIsMinting(true)

      const candyMachine = await fetchCandyMachine(umi, publicKey(id))
      console.log('Candy Machine Data:', candyMachine)

      if (!candyMachine.itemsLoaded || candyMachine.itemsLoaded < candyMachine.itemsAvailable) {
        throw new Error(
          `Candy Machine not fully loaded. Loaded: ${candyMachine.itemsLoaded}, Available: ${candyMachine.itemsAvailable}`
        )
      }

      const nftMint = generateSigner(umi)
      const nftOwner = umi.identity.publicKey

      console.log('Attempting mint with:', {
        candyMachine: id,
        nftMint: nftMint.publicKey.toString(),
        nftOwner: nftOwner.toString(),
      })

      const tx = transactionBuilder()
        .add(setComputeUnitLimit(umi, { units: 800_000 }))
        .add(
          mintV2(umi, {
            candyMachine: publicKey(id),
            nftMint,
            nftOwner,
            collectionMint: candyMachine.collectionMint,
            collectionUpdateAuthority: candyMachine.authority,
            tokenStandard: 0,
            mintArgs: {
              solPayment: some({ destination: publicKey(collection.creatorAddress) }),
              startDate: some({}),
              endDate: none(),
              mintLimit: none(),
              nftBurn: none(),
              nftGate: none(),
              nftPayment: none(),
              redeemedAmount: none(),
              tokenBurn: none(),
              tokenGate: none(),
              tokenPayment: none(),
              freezeSolPayment: none(),
              freezeTokenPayment: none(),
              programGate: none(),
              allocation: none(),
              allowList: none(),
            },
            configLineSettings: some({
              prefixName: '',
              nameLength: 32,
              prefixUri: '',
              uriLength: 200,
              isSequential: false,
            }),
            configLine: some({
              name: collection.name,
              uri: collection.metadata.uri,
            }),
          })
        )

      const result = await tx.sendAndConfirm(umi)

      const serializedSignature = base58.deserialize(result.signature)[0]
      console.log('Mint successful!', {
        signature: serializedSignature,
        explorerUrl: `https://explorer.solana.com/tx/${serializedSignature}?cluster=devnet`,
        nftMint: nftMint.publicKey.toString(),
      })

      await DatabaseProvider.incrementMintedCount(id)
      const updatedCollection = await DatabaseProvider.getCandyMachineById(id)
      setCollection(updatedCollection)
    } catch (error) {
      console.error('Error minting:', error)
      if (error.logs) {
        console.error('Transaction logs:', error.logs)
      }
    } finally {
      setIsMinting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-danger">{error}</div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Collection not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full fixed inset-0 mt-16" style={backgroundStyle}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

      <div className="relative z-10 h-full overflow-y-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 pb-16">
              <div className="md:w-1/2">
                <Card className="border-none bg-transparent">
                  <img
                    src={collection.metadata?.image || collection.image}
                    alt={collection.name}
                    className="w-full h-[600px] object-cover rounded-2xl"
                  />
                </Card>
              </div>

              <div className="md:w-1/2">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-default-500">Creator Collection</span>
                      <Button isIconOnly size="sm" variant="light" className="text-default-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h1 className="text-4xl font-bold mb-4">{collection.name}</h1>
                    <p className="text-default-500 text-sm mb-4">{collection.metadata?.description}</p>

                    <div className="flex gap-4 text-default-500 text-sm">
                      {collection.metadata?.external_url && (
                        <Link
                          href={collection.metadata.external_url}
                          target="_blank"
                          className="flex items-center gap-1"
                        >
                          <span>Website</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <Card className="bg-default-50">
                    <div className="p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${isLive ? 'bg-success' : 'bg-warning'}`}
                            ></span>
                            <span className="text-sm">{isLive ? 'Live' : 'Not Live'}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-2xl font-bold">{collection.price} SOL</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-default-500">Minted</div>
                          <div className="text-lg font-semibold">
                            {collection.itemsMinted} / {collection.itemsAvailable}
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-default-100 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(collection.itemsMinted / collection.itemsAvailable) * 100}%`,
                          }}
                        ></div>
                      </div>

                      {connected ? (
                        <Button
                          disabled={!isLive || isMinting}
                          color={isLive ? 'primary' : 'default'}
                          size="lg"
                          className="w-full"
                          radius="lg"
                          onPress={handleMint}
                          isLoading={isMinting}
                        >
                          {isMinting ? 'Minting...' : isLive ? 'Mint' : timeLeft ? `Starts in ${timeLeft}` : 'Not Live'}
                        </Button>
                      ) : (
                        <WalletMultiButton className="w-full py-4 px-8 rounded-xl bg-primary hover:bg-primary-500 text-white text-lg font-semibold" />
                      )}

                      <p className="text-center text-sm text-default-500">Limit 1 Per Wallet</p>
                    </div>
                  </Card>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Creators</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-default-100 rounded-full"></div>
                        <div>
                          <p className="font-semibold">
                            {collection.creatorAddress.slice(0, 4)}...{collection.creatorAddress.slice(-4)}
                          </p>
                          <p className="text-sm text-default-500">Creator</p>
                        </div>
                      </div>
                      <Button isIconOnly size="sm" variant="light">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
