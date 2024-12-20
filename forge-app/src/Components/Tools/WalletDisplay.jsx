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
        connection.getBalance(publicKey).then((balance) => {
          console.log(balance)
          setBalance(balance / LAMPORTS_PER_SOL)
        })
      } catch (error) {
        console.log('Error while getting the wallet balance: ', error)
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
