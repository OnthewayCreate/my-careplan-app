import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// ↓↓↓ この行を追加することで、デザイン（Tailwind CSS）が適用されます！
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)