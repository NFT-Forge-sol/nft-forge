const fs = require('fs').promises
const path = require('path')

const STORAGE_FILE = path.join(__dirname, 'data', 'candyMachines.json')

// Ensure the data directory exists
async function initStorage() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true })
    try {
      await fs.access(STORAGE_FILE)
    } catch {
      await fs.writeFile(STORAGE_FILE, JSON.stringify([]))
    }
  } catch (error) {
    console.error('Error initializing storage:', error)
  }
}

async function getAllCandyMachines() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading candy machines:', error)
    return []
  }
}

async function saveCandyMachine(candyMachine) {
  try {
    const candyMachines = await getAllCandyMachines()
    candyMachines.push(candyMachine)
    await fs.writeFile(STORAGE_FILE, JSON.stringify(candyMachines, null, 2))
    return true
  } catch (error) {
    console.error('Error saving candy machine:', error)
    return false
  }
}

module.exports = {
  initStorage,
  getAllCandyMachines,
  saveCandyMachine,
}
