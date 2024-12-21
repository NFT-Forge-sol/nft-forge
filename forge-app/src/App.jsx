import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './Components/Tools/WalletDisplay'
import './App.css'
import WalletDisplay from './Components/Tools/WalletDisplay'
import WalletContextProvider from './Components/Tools/WalletContextProvider'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Select, SelectItem } from '@nextui-org/react'
import ProjectForm from './Components/Items/ProjectForm'
import { Buffer } from 'buffer/'

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
        <h1 className="pb-3">Vite + React</h1>
        <WalletMultiButton />
        <WalletDisplay />

        <div className="card">
          <div className="pb-3">
            <input type="range" min={100} max={1000} value={range} step={100} onChange={handleRangeChange} />
            <label>Number of NFTs: </label>
            <input type="number" min={100} max={1000} value={range} onChange={handleRangeChange} onBlur={handleBlur} />
          </div>
          <div>
            <Select className="max-w-xs pb-3" placeholder="Select a style" label="Style">
              <SelectItem key={0}>Drawing</SelectItem>
              <SelectItem key={1}>8-Bit</SelectItem>
              <SelectItem key={2}>Realism</SelectItem>
            </Select>
          </div>
          <div>
            <Select className="max-w-xs pb-3" placeholder="Select a background" label="Background">
              <SelectItem key={0}>Full Color</SelectItem>
              <SelectItem key={1}>Fade</SelectItem>
              <SelectItem key={2}>City</SelectItem>
            </Select>
          </div>
          <h1>Create NFT from Image </h1>
          <ProjectForm />
        </div>
        <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
      </WalletContextProvider>
    </>
  )
}

export default App
