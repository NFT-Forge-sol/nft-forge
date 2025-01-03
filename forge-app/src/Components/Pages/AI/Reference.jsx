import { Button } from '@nextui-org/react'
import { useNavigate } from 'react-router-dom'
import CollectionForm from '../../Items/CollectionForm'

const Reference = () => {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">NFT Style Reference</h1>

      <div className="bg-forge-400/50 backdrop-blur-md rounded-lg p-8 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1>Create Collection</h1>
            <CollectionForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reference
