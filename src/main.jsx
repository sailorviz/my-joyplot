import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// React 18 的 <StrictMode> 会在开发环境中故意让 useEffect 执行两次。
// 只在开发模式（npm run dev）下触发两次。
// 生产模式（npm run build + npm run preview）下只会执行一次。