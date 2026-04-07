import { useState } from 'react'

function App() {
  const [count, setCount] = useState<number>(0)

  return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          Vite + React + Tailwind (TSX)
        </h1>
        <p className="text-gray-700 mb-8">
          Dein Hex-to-Binary Trainer Projekt ist bereit!
        </p>

        <button
            onClick={() => setCount((count) => count + 1)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
        >
          Counter ist: {count}
        </button>
      </div>
  )
}

export default App