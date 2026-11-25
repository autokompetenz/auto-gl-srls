import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { VehiclesProvider } from './context/VehiclesContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <VehiclesProvider>
        <App />
      </VehiclesProvider>
    </AuthProvider>
  </StrictMode>,
)
