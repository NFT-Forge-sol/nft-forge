import axios from 'axios'

const API_URL = 'http://localhost:5000'

class DatabaseProvider {
  async createCandyMachine(candyMachineData) {
    try {
      const response = await axios.post(`${API_URL}/api/candy-machines`, candyMachineData)
      return response.data
    } catch (error) {
      console.error('Error creating candy machine:', error)
      throw error
    }
  }

  async getAllCandyMachines() {
    try {
      const response = await axios.get(`${API_URL}/api/candy-machines`)
      return response.data
    } catch (error) {
      console.error('Error fetching all candy machines:', error)
      throw error
    }
  }

  async getCandyMachineById(candyMachineId) {
    try {
      const response = await axios.get(`${API_URL}/api/candy-machines/${candyMachineId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching candy machine:', error)
      throw error
    }
  }

  async updateCandyMachine(candyMachineId, updateData) {
    try {
      const response = await axios.put(`${API_URL}/api/candy-machines/${candyMachineId}`, updateData)
      return response.data
    } catch (error) {
      console.error('Error updating candy machine:', error)
      throw error
    }
  }

  async incrementMintedCount(candyMachineId) {
    try {
      const response = await axios.post(`${API_URL}/api/candy-machines/${candyMachineId}/mint`)
      return response.data
    } catch (error) {
      console.error('Error incrementing minted count:', error)
      throw error
    }
  }

  async getCreatorCandyMachines(creatorAddress) {
    try {
      const response = await axios.get(`${API_URL}/api/candy-machines/creator/${creatorAddress}`)
      return response.data
    } catch (error) {
      console.error('Error fetching creator candy machines:', error)
      throw error
    }
  }

  async updateCandyMachineStatus(candyMachineId, status) {
    try {
      const response = await axios.put(`${API_URL}/api/candy-machines/${candyMachineId}/status`, { status })
      return response.data
    } catch (error) {
      console.error('Error updating candy machine status:', error)
      throw error
    }
  }

  async generateImage(prompt) {
    try {
      const response = await axios.post(`${API_URL}/api/generate-image`, { prompt })
      return response.data
    } catch (error) {
      console.error('Error generating image:', error)
      throw error
    }
  }

  async uploadToPinata(file) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/api/upload-to-pinata`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`)
      }

      const data = await response.json()
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
    } catch (error) {
      console.error(error)
      throw new Error('Failed to upload file to Pinata.')
    }
  }

  async listModels() {
    try {
      const response = await axios.get(`${API_URL}/api/list-models`)
      return response.data
    } catch (error) {
      console.error('Error listing models:', error)
      throw error
    }
  }

  formatCandyMachineData(data) {
    return {
      candyMachineId: data.address.toString(),
      name: data.name,
      symbol: data.symbol,
      price: data.price,
      itemsAvailable: data.itemsAvailable,
      creatorAddress: data.creatorAddress.toString(),
      goLiveDate: data.goLiveDate,
      metadata: {
        description: data.description,
        image: data.image,
        external_url: data.externalUrl,
        attributes: data.attributes || [],
      },
    }
  }

  async setCollectionNFT(candyMachineId, collectionUri) {
    try {
      const response = await axios.post(`${API_URL}/api/candy-machines/${candyMachineId}/collection`, {
        collectionUri,
      })
      return response.data
    } catch (error) {
      console.error('Error setting collection NFT:', error)
      throw error
    }
  }

  async generateNFTMetadata(prompt, number = 10) {
    try {
      const response = await axios.post(`${API_URL}/api/generate-nft/metadata`, {
        prompt,
        number,
      })
      return response.data
    } catch (error) {
      console.error('Error generating NFT metadata:', error)
      throw error
    }
  }
}

export default new DatabaseProvider()
