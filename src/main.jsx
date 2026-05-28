import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply theme before first render to prevent flash
const theme = localStorage.getItem('leo-theme') || 'light';
document.documentElement.setAttribute('data-theme', theme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
