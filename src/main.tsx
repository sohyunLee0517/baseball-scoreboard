import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { OwnerIdProvider } from './ownerId-store'
import { MyTeamProvider } from './my-team-store'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/scoreboard">
      <OwnerIdProvider>
        <MyTeamProvider>
          <App />
        </MyTeamProvider>
      </OwnerIdProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
