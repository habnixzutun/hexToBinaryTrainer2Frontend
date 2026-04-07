import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore
import './index.css';
import App from "./App.tsx"

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Failed to find the root element');
}

createRoot(rootElement as HTMLElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
)