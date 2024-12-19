import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './Components/WalletDisplay'
import './App.css'
import WalletDisplay from './Components/WalletDisplay'
import WalletContextProvider from './Components/WalletContextProvider'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <WalletContextProvider>
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React</h1>
        <WalletDisplay />
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
          <WalletMultiButton />
        </div>
        <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
      </WalletContextProvider>
    </>
  )
}

export default App
