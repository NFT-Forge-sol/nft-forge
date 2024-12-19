import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './Components/WalletDisplay'
import './App.css'
import WalletDisplay from './Components/WalletDisplay'
import WalletContextProvider from './Components/WalletContextProvider'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

function App() {
  const [range, setRange] = useState(100)

  const handleRangeChange = (event) => {
    setRange(event.target.value)
  }

  const handleBlur = (event) => {
    if (event.target.value < 100) {
      setRange(100)
    }

    if (event.target.value > 1000) {
      setRange(1000)
    }
  }

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
        <div className="card">
          <div>
            <input type="range" min={100} max={1000} value={range} step={100} onChange={handleRangeChange} />
            <label>Number of NFTs: </label>
            <input type="number" min={100} max={1000} value={range} onChange={handleRangeChange} onBlur={handleBlur} />
          </div>
          <div>
            <label>Style</label>
            <select>
              <option>Drawing</option>
              <option>8-Bit</option>
              <option>Real</option>
            </select>
          </div>
          <div>
            <label>Background</label>
            <select>
              <option>Full Color</option>
              <option>Fade</option>
              <option>City</option>
            </select>
          </div>
          <WalletDisplay />
          <WalletMultiButton />
        </div>
        <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
      </WalletContextProvider>
    </>
  )
}

export default App
