import { useState } from 'react'
import PropTypes from 'prop-types'

const FileInput = ({ onFileChange }) => {
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null) // État pour stocker l'URL de prévisualisation

  const allowedExtensions = ['svg', 'png', 'jpg', 'jpeg']

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase()
      if (allowedExtensions.includes(fileExtension)) {
        setFileName(file.name)
        setError('')
        setPreviewUrl(URL.createObjectURL(file)) // Génère une URL temporaire pour l'aperçu
        onFileChange(file)
      } else {
        setFileName('')
        setError('Invalid file type. Please select an SVG, PNG, JPG, or JPEG file.')
        setPreviewUrl(null) // Réinitialise l'aperçu
        onFileChange(null)
      }
    } else {
      setFileName('')
      setError('')
      setPreviewUrl(null) // Réinitialise l'aperçu
      onFileChange(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-center w-full mt-5">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-dashed rounded-lg cursor-pointer bg-default-50 hover:bg-default-100 border-default-200 dark:bg-default-100 hover:border-2 dark:hover:bg-default-50 dark:border-default-600 dark:hover:border-default-500"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-32 h-32 mb-4 object-cover rounded-lg" />
            ) : (
              <svg
                className="w-8 h-8 mb-4 text-default-500 dark:text-default-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
            )}
            {fileName ? (
              <p className="mb-2 text-sm text-default-500 dark:text-default-400">
                Selected file: <span className="font-semibold">{fileName}</span>
              </p>
            ) : (
              <p className="mb-2 text-sm text-default-500 dark:text-default-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
            )}
            <p className="text-xs text-default-100 dark:text-default-400">SVG, PNG, JPG, or JPEG</p>
          </div>
          <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400 pt-2">{error}</p>}
    </>
  )
}

FileInput.propTypes = {
  onFileChange: PropTypes.func.isRequired,
}

export default FileInput