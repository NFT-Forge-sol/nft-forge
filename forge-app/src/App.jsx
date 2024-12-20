import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './Components/Tools/WalletDisplay'
import './App.css'
import WalletDisplay from './Components/Tools/WalletDisplay'
import WalletContextProvider from './Components/Tools/WalletContextProvider'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import ImageGenerator from './Components/Tools/ImageGenerator'
import { Button, Select, SelectItem } from '@nextui-org/react'

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
            <Select className="max-w-xs" placeholder="Select a style" label="Style">
              <SelectItem key={0}>Drawing</SelectItem>
              <SelectItem key={1}>8-Bit</SelectItem>
              <SelectItem key={2}>Realism</SelectItem>
            </Select>
          </div>
          <div>
            <Select className="max-w-xs" placeholder="Select a background" label="Background">
              <SelectItem key={0}>Full Color</SelectItem>
              <SelectItem key={1}>Fade</SelectItem>
              <SelectItem key={2}>City</SelectItem>
            </Select>
          </div>
          <WalletDisplay />
          <WalletMultiButton />
          <ImageGenerator />
        </div>
        <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
        <Button>Go to image generation</Button>
      </WalletContextProvider>
    </>
  )
}

export default App
