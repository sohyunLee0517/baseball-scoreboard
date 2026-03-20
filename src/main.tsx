import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { OwnerIdProvider } from './ownerId-store'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OwnerIdProvider>
      <App />
    </OwnerIdProvider>
  </React.StrictMode>,
)
