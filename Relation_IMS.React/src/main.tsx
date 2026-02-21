import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AlertProvider } from './context/AlertContext'
import { setupGlobalAlerts } from './services/DialogService'

// Replace standard window.alert with our nice dialog
setupGlobalAlerts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AlertProvider>
        <App />
      </AlertProvider>
    </BrowserRouter>
  </StrictMode>,
)

