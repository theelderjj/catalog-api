import { useState } from 'react'
import CatalogPage from './pages/CatalogPage'
import RequestLogPanel from './components/RequestLogPanel'
import ConceptPanel from './components/ConceptPanel'

type Tab = 'catalog' | 'concepts'

export default function App() {
  const [tab, setTab] = useState<Tab>('catalog')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">📦 Catalog API</h1>
          <p className="text-xs text-gray-400">API learning playground</p>
        </div>
        <div className="flex gap-2">
          {(['catalog', 'concepts'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Main layout: left = content, right = request log */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <main className="flex-1 overflow-y-auto p-6">
          {tab === 'catalog'   && <CatalogPage />}
          {tab === 'concepts'  && <ConceptPanel />}
        </main>

        {/* Right panel — always visible request log */}
        <aside className="w-80 shrink-0 border-l bg-white flex flex-col overflow-hidden">
          <RequestLogPanel />
        </aside>
      </div>
    </div>
  )
}
