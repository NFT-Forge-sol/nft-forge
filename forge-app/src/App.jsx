import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './Tools/WalletDisplay'
import './App.css'
import WalletDisplay from './Tools/WalletDisplay'
import WalletContextProvider from './Tools/WalletContextProvider'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Select, SelectItem } from '@nextui-org/react'
import ProjectForm from './Components/Items/ProjectForm'
import { Buffer } from 'buffer/'
import CollectionForm from './Components/Items/CollectionForm'

function App() {
  const [range, setRange] = useState(100)
  const [selectedCollection, setSelectedCollection] = useState(null)
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
        <WalletMultiButton />
        <WalletDisplay />

        <div className="w-[100%]">
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
          <div className="flex ">
            <div className="w-[100%]">
              <h1>Create Collection</h1>
              <CollectionForm />
            </div>
            <div className="w-[100%]">
              <h1>Create NFT from Image </h1>
              <ProjectForm />
            </div>
          </div>
        </div>
      </WalletContextProvider>
    </>
  )
}

export default App
