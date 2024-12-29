import { useState } from 'react'
import { Modal, ModalContent, ModalBody, Button, Card, CardBody } from '@nextui-org/react'

export default function NFT() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const steps = [
    {
      title: 'Create NFTs with AI',
      description: 'Generate unique NFT artwork using artificial intelligence',
    },
    {
      title: 'Create Collection',
      description: 'Set up your NFT collection details and properties',
    },
    {
      title: 'Create Candy Machine & Mint',
      description: 'Deploy your candy machine and mint your first NFT',
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = () => {
    setIsModalOpen(false)
    setCurrentStep(1) // Reset step when modal closes
  }

  return (
    <>
      <Button onPress={() => setIsModalOpen(true)} color="primary">
        Create NFT
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
        backdrop="opaque"
        classNames={{
          backdrop: 'bg-black/50',
        }}
      >
        <ModalContent>
          <ModalBody className="p-6">
            <h1 className="text-3xl font-bold mb-6">Create Your NFT</h1>

            <Card>
              <CardBody className="p-6">
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    {steps.map((step, index) => (
                      <div
                        key={index}
                        className={`flex items-center ${
                          index + 1 <= currentStep ? 'text-primary' : 'text-default-400'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            index + 1 <= currentStep ? 'border-primary bg-primary text-white' : 'border-default-400'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="ml-2">{step.title}</span>
                      </div>
                    ))}
                  </div>
                  <div className="relative pt-1">
                    <div className="flex h-2 mb-4 overflow-hidden rounded bg-default-200">
                      <div
                        className="bg-primary transition-all duration-300"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Step content */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">{steps[currentStep - 1].title}</h2>
                  <p className="text-default-500 mb-4">{steps[currentStep - 1].description}</p>

                  {/* Add your step-specific content here */}
                  {currentStep === 1 && <div>{/* AI NFT Creation Form */}</div>}
                  {currentStep === 2 && <div>{/* Collection Creation Form */}</div>}
                  {currentStep === 3 && <div>{/* Candy Machine & Minting Interface */}</div>}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    onPress={handlePrevious}
                    isDisabled={currentStep === 1}
                    color={currentStep === 1 ? 'default' : 'primary'}
                    variant="flat"
                  >
                    Previous
                  </Button>
                  {currentStep === steps.length ? (
                    <Button onPress={handleFinish} color="success">
                      Finish
                    </Button>
                  ) : (
                    <Button onPress={handleNext} color="primary">
                      Next
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
