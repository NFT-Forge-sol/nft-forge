import { useState } from 'react'
import { Select, SelectItem } from '@nextui-org/react'
import ProjectForm from '../Items/ProjectForm'
import CollectionForm from '../Items/CollectionForm'

export default function Home() {
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
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-6 text-primary-500">Welcome to Forge</h1>
        <p className="text-xl text-primary-600">Create, Mint, and Trade NFTs on Solana</p>
      </div>

      <div className="w-[100%]">
        <div className="flex">
          <div className="w-[100%]">
            <h1>Create Collection</h1>
            <CollectionForm />
          </div>
          <div className="w-[100%]">
            <h1>Create NFT from Image</h1>
            <ProjectForm />
          </div>
        </div>
      </div>
    </div>
  )
}
