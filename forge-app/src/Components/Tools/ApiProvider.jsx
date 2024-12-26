export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch('http://localhost:5000/api/upload-to-pinata', {
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
