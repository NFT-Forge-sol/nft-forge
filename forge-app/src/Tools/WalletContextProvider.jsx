import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import PropTypes from 'prop-types'
import '@solana/wallet-adapter-react-ui/styles.css'

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets'

const WalletContextProvider = ({ children }) => {
  const endpoint = clusterApiUrl('devnet')

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

WalletContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default WalletContextProvider
