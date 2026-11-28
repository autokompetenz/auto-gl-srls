import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { VehiclesProvider } from './context/VehiclesContext'
import { LocaleProvider } from './i18n'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <AuthProvider>
        <VehiclesProvider>
          <App />
        </VehiclesProvider>
      </AuthProvider>
    </LocaleProvider>
  </StrictMode>,
)
