import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { CinemaProvider } from './contexts/CinemaContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CinemaProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#171717',
                color: '#f5f5f5',
                border: '1px solid #262626',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, system-ui, sans-serif',
                padding: '12px 16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f5f5f5',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f5f5f5',
                },
              },
            }}
          />
        </CinemaProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
