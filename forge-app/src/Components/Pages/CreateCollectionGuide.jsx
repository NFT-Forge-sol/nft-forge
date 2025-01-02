import { Card } from '@nextui-org/react'
import { Link } from 'react-router-dom'
import { Wand2, Image as ImageIcon, Palette, Upload, Settings, Rocket } from 'lucide-react'

export default function CreateCollectionGuide() {
  const steps = [
    {
      title: 'Prepare Your Artwork',
      description: "Choose how you want to create your NFT artwork using our platform's tools:",
      icon: <Palette className="text-primary-500" size={24} />,
      options: [
        {
          title: 'Use AI Generation From Scratch',
          description: 'Create unique NFTs using our AI text-to-image generator',
          link: '/ai/from-scratch',
          tips: [
            'Write detailed prompts for better results',
            'Generate multiple variations',
            'Fine-tune your favorites',
          ],
        },
        {
          title: 'Use AI with Reference Images',
          description: 'Transform existing images into new artwork using AI',
          link: '/ai/reference',
          tips: ['Upload reference images', 'Adjust style and variations', 'Blend multiple references'],
        },
        {
          title: 'Upload Your Own Artwork',
          description: 'Use your pre-made artwork for the collection',
          link: '/mint',
          tips: ['Recommended size: 2000x2000px', 'Supported formats: PNG, JPG', 'Max file size: 10MB'],
        },
      ],
    },
    {
      title: 'Create Your Collection',
      description: 'Use our tools to set up your collection properties and metadata.',
      icon: <Settings className="text-primary-500" size={24} />,
      tips: [
        'Set collection name and symbol',
        'Write compelling description',
        'Define rarity traits',
        'Configure mint price',
        'Set maximum supply',
        'Choose launch date and time',
      ],
    },
    {
      title: 'Deploy Your Collection',
      description: 'Launch your collection on the Solana blockchain using our platform.',
      icon: <Rocket className="text-primary-500" size={24} />,
      tips: [
        'Connect your wallet',
        'Review collection settings',
        'Upload artwork and metadata',
        'Pay deployment fee',
        'Share your collection',
      ],
    },
  ]

  return (
    <div className="min-h-screen w-full p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Create Your NFT Collection</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Follow this guide to create and deploy your own NFT collection using our comprehensive tools
          </p>
        </div>

        <div className="grid gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="p-6 bg-forge-400/50 backdrop-blur-md border border-primary-500/20">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </div>

                {step.options ? (
                  <div className="grid md:grid-cols-3 gap-4 pl-14">
                    {step.options.map((option, optionIndex) => (
                      <Card key={optionIndex} className="p-4 bg-forge-500/30">
                        <h4 className="font-semibold mb-2">{option.title}</h4>
                        <p className="text-sm text-gray-400 mb-4">{option.description}</p>
                        <ul className="text-sm text-gray-300 space-y-2 mb-4">
                          {option.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start gap-2">
                              <span className="text-primary-500">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                        <Link
                          to={option.link}
                          className="inline-block w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-center"
                        >
                          Try Now
                        </Link>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="pl-14 space-y-6">
                    <ul className="grid md:grid-cols-2 gap-4">
                      {step.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2 text-gray-300">
                          <span className="text-primary-500">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>

                    {step.title === 'Create Your Collection' && (
                      <Link
                        to="/"
                        className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-center"
                      >
                        Create Collection
                      </Link>
                    )}

                    {step.title === 'Deploy Your Collection' && (
                      <Link
                        to="/mint"
                        className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-center"
                      >
                        Deploy Collection
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-4 pt-8">
          <h2 className="text-2xl font-bold">Ready to Start Creating?</h2>
          <p className="text-gray-400">Choose your preferred creation method and begin building your NFT collection</p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/ai/from-scratch"
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Create with AI
            </Link>
            <Link
              to="/mint"
              className="px-6 py-3 bg-forge-500 text-white rounded-lg hover:bg-forge-600 transition-colors"
            >
              Upload Artwork
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
