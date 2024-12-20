import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

const WalletDisplay = () => {
  const [balance, setBalance] = useState(0)
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  useEffect(() => {
    const updateBalance = async () => {
      if (!connection || !publicKey) {
        console.warn('Wallet not connected or connection unavailable')
        return
      }

      try {
        const balance = await connection.getBalance(publicKey)
        setBalance(balance / LAMPORTS_PER_SOL)
      } catch (error) {
        console.error('Error while getting the wallet balance:', error)
      }
    }

    updateBalance()

    const interval = setInterval(() => {
      updateBalance()
    }, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [connection, publicKey])

  return (
    <div>
      <p>{publicKey ? `Balance: ${balance.toFixed(4)} SOL` : 'Please connect your wallet'}</p>
    </div>
  )
}

export default WalletDisplay
