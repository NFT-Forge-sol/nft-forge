import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ThemeProvider from './Tools/ThemeProvider.jsx'
import { Toaster } from 'sonner'
import { Buffer } from 'buffer/'
import process from 'process'
window.Buffer = Buffer
window.process = process

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster richColors />
      <App />
    </ThemeProvider>
  </StrictMode>
)
