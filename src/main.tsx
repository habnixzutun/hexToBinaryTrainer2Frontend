import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Failed to find the root element');
}

createRoot(rootElement as HTMLElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
)