/**
 * RequestLogPanel
 *
 * Live feed of every API call made during the session. Shows method, URL,
 * status, duration, and — most importantly for learning — whether each
 * request is safe, idempotent, and/or stateful.
 */
import { useEffect, useState } from 'react'
import { subscribeToLogs } from '../api/client'
import type { RequestLog } from '../types'

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-blue-100 text-blue-800',
  POST:   'bg-green-100 text-green-800',
  PUT:    'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
}

const STATUS_COLOR = (s: number) =>
  s < 300 ? 'text-green-600' : s < 400 ? 'text-yellow-600' : 'text-red-600'

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${
      active ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
    }`}>
      {label}
    </span>
  )
}

export default function RequestLogPanel() {
  const [logs, setLogs] = useState<RequestLog[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    return subscribeToLogs(log => {
      setLogs(prev => [log, ...prev].slice(0, 50)) // keep last 50
    })
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-700 text-sm">Request Log</h2>
        {logs.length > 0 && (
          <button onClick={() => setLogs([])} className="text-xs text-gray-400 hover:text-red-500">
            Clear
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Make an API call to see it logged here
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y text-xs font-mono">
          {logs.map(log => (
            <div key={log.id} className="cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
              {/* Summary row */}
              <div className="flex items-center gap-2 px-3 py-2">
                <span className={`px-1.5 py-0.5 rounded font-bold text-xs ${METHOD_COLORS[log.method]}`}>
                  {log.method}
                </span>
                <span className="flex-1 truncate text-gray-700">{log.url}</span>
                <span className={`font-bold ${STATUS_COLOR(log.responseStatus)}`}>
                  {log.responseStatus}
                </span>
                <span className="text-gray-400">{log.durationMs}ms</span>
              </div>

              {/* Property badges */}
              <div className="flex gap-1 px-3 pb-2">
                <Badge label="safe"        active={log.isSafe} />
                <Badge label="idempotent"  active={log.isIdempotent} />
                <Badge label="stateful"    active={log.isStateful} />
              </div>

              {/* Expanded detail */}
              {expanded === log.id && (
                <div className="px-3 pb-3 space-y-2 bg-gray-50 border-t">
                  <div className="pt-2">
                    <p className="text-gray-500 mb-1">Request Headers</p>
                    <pre className="bg-white border rounded p-2 text-xs overflow-auto">
                      {JSON.stringify(log.requestHeaders, null, 2)}
                    </pre>
                  </div>
                  {log.requestBody !== undefined && (
                    <div>
                      <p className="text-gray-500 mb-1">Request Body</p>
                      <pre className="bg-white border rounded p-2 text-xs overflow-auto">
                        {JSON.stringify(log.requestBody, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 mb-1">Response Body</p>
                    <pre className="bg-white border rounded p-2 text-xs overflow-auto max-h-40">
                      {JSON.stringify(log.responseBody, null, 2)}
                    </pre>
                  </div>
                  <div className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
