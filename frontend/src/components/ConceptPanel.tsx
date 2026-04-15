/**
 * ConceptPanel
 *
 * Explains API concepts visually — stateful vs stateless, HTTP methods,
 * idempotency, and safety. Updates highlighting based on the last request.
 */
import { useEffect, useState } from 'react'
import { subscribeToLogs } from '../api/client'
import type { RequestLog } from '../types'

interface ConceptCardProps {
  title: string
  highlight: boolean
  color: string
  children: React.ReactNode
}

function ConceptCard({ title, highlight, color, children }: ConceptCardProps) {
  return (
    <div className={`rounded-lg border-2 p-4 transition-all duration-300 ${
      highlight ? `border-${color}-400 bg-${color}-50 shadow-md` : 'border-gray-200 bg-white'
    }`}>
      <h3 className={`font-bold text-sm mb-2 ${highlight ? `text-${color}-700` : 'text-gray-600'}`}>
        {title}
      </h3>
      <div className="text-xs text-gray-600 space-y-1">{children}</div>
    </div>
  )
}

const METHOD_INFO: Record<string, { safe: boolean; idempotent: boolean; stateful: boolean; description: string; example: string }> = {
  GET: {
    safe: true, idempotent: true, stateful: false,
    description: 'Reads data. Never modifies anything. Calling it 100× = same as calling it once.',
    example: 'GET /api/items — returns the same list every time (until a mutation occurs)',
  },
  POST: {
    safe: false, idempotent: false, stateful: true,
    description: 'Creates a new resource. Each call creates another one — not idempotent.',
    example: 'POST /api/items — every call creates a new item with a new ID',
  },
  PUT: {
    safe: false, idempotent: true, stateful: true,
    description: 'Replaces/updates a resource. Calling it twice with the same body gives the same result.',
    example: 'PUT /api/items/abc — sets the item to the exact body you send',
  },
  DELETE: {
    safe: false, idempotent: true, stateful: true,
    description: 'Removes a resource. Deleting something already gone leaves the same final state.',
    example: 'DELETE /api/items/abc — whether it existed or not, it\'s gone after',
  },
}

export default function ConceptPanel() {
  const [last, setLast] = useState<RequestLog | null>(null)

  useEffect(() => {
    return subscribeToLogs(log => setLast(log))
  }, [])

  const info = last ? METHOD_INFO[last.method] : null

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold text-gray-800">API Concepts</h2>

      {/* Last request summary */}
      {last && info && (
        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-xs space-y-1">
          <p className="font-semibold text-indigo-700">Last request: {last.method} {last.url}</p>
          <p className="text-indigo-600">{info.description}</p>
          <p className="text-gray-500 italic">{info.example}</p>
        </div>
      )}

      {/* Stateless vs Stateful */}
      <div className="grid grid-cols-2 gap-3">
        <ConceptCard
          title="Stateless Protocol (HTTP)"
          highlight={!!(last && !last.isStateful)}
          color="blue"
        >
          <p>Each request carries <strong>all the info the server needs</strong> — no memory of previous calls.</p>
          <p className="mt-1 text-blue-700">✓ Triggered by: GET requests</p>
        </ConceptCard>

        <ConceptCard
          title="Stateful Server Data"
          highlight={!!(last && last.isStateful)}
          color="orange"
        >
          <p>The server <strong>remembers data between requests</strong> (your items catalog).</p>
          <p className="mt-1 text-orange-700">✓ Triggered by: POST, PUT, DELETE</p>
        </ConceptCard>
      </div>

      {/* Safety and Idempotency */}
      <div className="grid grid-cols-2 gap-3">
        <ConceptCard
          title="Safe Methods"
          highlight={!!(last && last.isSafe)}
          color="green"
        >
          <p>Read-only. <strong>Never change data</strong> on the server.</p>
          <p className="mt-1">Methods: <code>GET</code>, <code>HEAD</code>, <code>OPTIONS</code></p>
        </ConceptCard>

        <ConceptCard
          title="Idempotent Methods"
          highlight={!!(last && last.isIdempotent)}
          color="purple"
        >
          <p>Calling them <strong>N times = same result as 1 time</strong>.</p>
          <p className="mt-1">Methods: <code>GET</code>, <code>PUT</code>, <code>DELETE</code></p>
          <p className="text-red-600 mt-1">Not idempotent: <code>POST</code></p>
        </ConceptCard>
      </div>

      {/* HTTP Methods grid */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">HTTP Methods</h3>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Method</th>
              <th className="text-center p-2 border">Safe</th>
              <th className="text-center p-2 border">Idempotent</th>
              <th className="text-left p-2 border">Use for</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(METHOD_INFO).map(([method, m]) => (
              <tr key={method} className={last?.method === method ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}>
                <td className="p-2 border font-mono">{method}</td>
                <td className="p-2 border text-center">{m.safe ? '✓' : '✗'}</td>
                <td className="p-2 border text-center">{m.idempotent ? '✓' : '✗'}</td>
                <td className="p-2 border text-gray-600">{
                  { GET: 'Read / list', POST: 'Create new', PUT: 'Update existing', DELETE: 'Remove' }[method]
                }</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status codes cheatsheet */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Status Codes</h3>
        <div className="space-y-1 text-xs">
          {[
            { code: '200 OK', color: 'text-green-600', desc: 'Request succeeded, body contains result' },
            { code: '201 Created', color: 'text-green-600', desc: 'Resource was created (POST success)' },
            { code: '204 No Content', color: 'text-green-600', desc: 'Success, no body (DELETE success)' },
            { code: '400 Bad Request', color: 'text-yellow-600', desc: 'Client sent invalid data' },
            { code: '404 Not Found', color: 'text-orange-600', desc: 'Resource doesn\'t exist' },
            { code: '422 Unprocessable', color: 'text-red-500', desc: 'Validation failed' },
            { code: '500 Server Error', color: 'text-red-600', desc: 'Something broke on the server' },
          ].map(({ code, color, desc }) => (
            <div key={code} className="flex gap-2">
              <span className={`font-mono font-bold ${color} w-36 shrink-0`}>{code}</span>
              <span className="text-gray-600">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
