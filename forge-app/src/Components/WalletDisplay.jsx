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
        console.error('Wallet not connected or connection unavailable')
        return
      }

      try {
        const accountInfo = await connection.getAccountInfo(publicKey)

        if (accountInfo) {
          setBalance(accountInfo.lamports / LAMPORTS_PER_SOL)
        } else {
          console.error('Account info not found')
        }
      } catch (error) {
        console.error('Failed to retrieve account info:', error)
      }
    }

    const interval = setInterval(() => {
      updateBalance()
    }, 10000)

    updateBalance()

    return () => {
      clearInterval(interval)
    }
  }, [connection, publicKey])

  return (
    <div>
      <p>{publicKey ? `Balance : ${balance} SOL` : 'Please connect your wallet'}</p>
    </div>
  )
}

export default WalletDisplay
