import { useState, useEffect } from 'react'
import axios from 'axios'

function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState([])
  const API_URL = 'http://localhost:5000/api'

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_URL}/list-models`)
      setModels(response.data.models)
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles:', error)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(
        `${API_URL}/generate-image`,
        { prompt },
        {
          responseType: 'arraybuffer',
        }
      )

      const blob = new Blob([response.data], { type: 'image/png' })
      const imageObjectURL = URL.createObjectURL(blob)
      setImageUrl(imageObjectURL)
    } catch (error) {
      console.error("Erreur lors de la génération de l'image:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Entrez un prompt pour générer une image"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Génération en cours...' : 'Générer Image'}
        </button>
      </form>
      {imageUrl && <img src={imageUrl} alt="Image générée" />}
      <div>
        <h3>Modèles disponibles:</h3>
        <ul>
          {models.map((model, index) => (
            <li key={index}>{model}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ImageGenerator
