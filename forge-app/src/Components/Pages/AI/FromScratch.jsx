import { useState } from 'react'
import { Button, Input, Spinner, Card, CardBody, Tab, Tabs } from '@nextui-org/react'
import DatabaseProvider from '../../../Database/DatabaseProvider'

const FromScratch = () => {
  const [prompt, setPrompt] = useState('')
  const [number, setNumber] = useState(10)
  const [loading, setLoading] = useState(false)
  const [generatedNFTs, setGeneratedNFTs] = useState(null)
  const [error, setError] = useState(null)
  const [selectedView, setSelectedView] = useState('preview')

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await DatabaseProvider.generateNFTMetadata(prompt, number)
      console.log(response)
      const nftData = typeof response === 'string' ? JSON.parse(response) : response
      setGeneratedNFTs(nftData)
    } catch (err) {
      setError('Failed to generate NFTs. Please try again.')
      console.error('Error generating NFTs:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Create NFTs From Scratch</h1>

      <div className="grid gap-6 mb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Collection Prompt"
            placeholder="Enter a description for your NFT collection (e.g., 'a collection of cyber apes')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="md:col-span-2"
          />

          <Input
            type="number"
            label="Number of NFTs"
            placeholder="Enter number of NFTs to generate"
            value={number}
            onChange={(e) => setNumber(parseInt(e.target.value))}
            min={1}
            max={100}
          />
        </div>

        <div>
          <Button
            color="primary"
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-40"
            startContent={loading && <Spinner size="sm" />}
          >
            {loading ? 'Generating...' : 'Generate NFTs'}
          </Button>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        {loading && (
          <Card className="bg-forge-400/50 backdrop-blur-md p-8">
            <CardBody className="flex items-center justify-center">
              <div className="text-center">
                <Spinner size="lg" className="mb-4" />
                <p className="text-white">Generating your NFT collection...</p>
                <p className="text-white/60 text-sm mt-2">This might take a few moments</p>
              </div>
            </CardBody>
          </Card>
        )}

        {generatedNFTs && !loading && (
          <div className="space-y-4">
            <Tabs selectedKey={selectedView} onSelectionChange={setSelectedView} className="mb-4">
              <Tab key="preview" title="Preview">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {Array.isArray(generatedNFTs) &&
                    generatedNFTs.map((nft, index) => (
                      <Card key={index} className="bg-forge-400/50 backdrop-blur-md">
                        <CardBody>
                          <h3 className="text-lg font-semibold mb-2">{`NFT #${index + 1}`}</h3>
                          <p className="text-sm mb-2">{nft.description}</p>
                          <p className="text-xs mb-2 text-gray-400">{nft.prompt}</p>
                          <div className="text-sm">
                            <h4 className="font-semibold mb-1">Traits:</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {nft.attributes &&
                                nft.attributes.map((trait, traitIndex) => (
                                  <div key={traitIndex} className="bg-forge-300/50 p-2 rounded">
                                    <span className="font-medium">{trait.trait_type}:</span> <span>{trait.value}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                </div>
              </Tab>
              <Tab key="json" title="JSON">
                <Card className="bg-forge-400/50 backdrop-blur-md">
                  <CardBody>
                    <pre className="text-sm overflow-auto p-4 bg-forge-300/30 rounded">
                      {JSON.stringify(generatedNFTs, null, 2)}
                    </pre>
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>

            <Button
              color="secondary"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(generatedNFTs, null, 2))}
              className="mt-4"
            >
              Copy JSON to Clipboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FromScratch
