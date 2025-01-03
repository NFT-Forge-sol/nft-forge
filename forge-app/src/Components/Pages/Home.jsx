import { Button, Input, cn } from '@nextui-org/react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'

const Home = () => {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')

  const handleCreate = () => {
    if (prompt.trim()) {
      navigate(`/ai/from-scratch?prompt=${encodeURIComponent(prompt)}`)
    }
  }

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[90vh] flex items-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create Your NFT Collection with AI
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Generate unique, high-quality NFT collections in minutes using our advanced AI technology. Turn your
              creative vision into reality.
            </p>

            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-border-flow"></div>
                  <Input
                    type="text"
                    placeholder="Describe your NFT collection (e.g., 'cyber punk cats')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 relative"
                    size="lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                    classNames={{
                      input: ['text-white'],
                      inputWrapper: ['bg-default-100', 'hover:bg-default-200', 'transition-colors'],
                    }}
                  />
                </div>
                <Button
                  color="primary"
                  size="lg"
                  className="text-lg"
                  onPress={handleCreate}
                  isDisabled={!prompt.trim()}
                >
                  Create Now
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="bordered" size="lg" className="text-lg" onPress={() => navigate('/create-guide')}>
                View Guide
              </Button>
              <Button variant="bordered" size="lg" className="text-lg" onPress={() => navigate('/marketplace')}>
                Explore Marketplace
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-forge-400/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Experience the future of NFT creation with our powerful AI tools and seamless workflow. Our platform
              combines cutting-edge technology with user-friendly features to help you bring your NFT collection to
              life.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                className="bg-forge-400/10 backdrop-blur-sm rounded-xl p-6 border border-forge-400/20"
              >
                <div className="text-primary text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
                <ul className="mt-4 text-gray-400 space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Create your NFT collection in three simple steps. Our streamlined process makes it easy to go from concept
              to completed collection in minutes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-300 mb-4">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Create Your NFT Collection?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join the next generation of NFT creators and bring your unique vision to life. Start creating your
              collection today with our AI-powered platform.
            </p>
            <Button color="primary" size="lg" className="text-lg" onPress={() => navigate('/create-guide')}>
              View Guide
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

// Features data with expanded content
const features = [
  {
    icon: '🎨',
    title: 'AI-Powered Generation',
    description: 'Create unique NFTs with our advanced AI technology that ensures each piece is one-of-a-kind.',
    benefits: [
      'Unique trait combinations for each NFT',
      'Consistent style across collections',
      'High-quality artwork generation',
    ],
  },
  {
    icon: '⚡',
    title: 'Quick & Easy',
    description: 'Generate entire collections in minutes with our streamlined creation process.',
    benefits: ['Intuitive user interface', 'Rapid generation speed', 'Bulk creation capabilities'],
  },
  {
    icon: '🎯',
    title: 'Custom Traits',
    description: 'Define unique attributes and traits for your NFTs to make them truly special.',
    benefits: ['Flexible trait system', 'Rarity controls', 'Automatic metadata generation'],
  },
]

// Steps data with added tips
const steps = [
  {
    title: 'Describe Your Vision',
    description: 'Enter a description of your NFT collection idea in the prompt field.',
  },
  {
    title: 'Generate Collection',
    description: 'Our AI will create unique pieces following your description and our style guide.',
  },
  {
    title: 'Customize & Mint',
    description: 'Fine-tune your collection and mint it to the blockchain.',
  },
]

export default Home
