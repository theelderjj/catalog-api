/**
 * StatsPanel — demonstrates a stateful endpoint.
 *
 * GET /api/stats returns data the SERVER computes from its own memory.
 * The client has no way to derive this — it doesn't know about all items
 * or how many requests have been handled. This is a clear example of
 * server-side state that persists across requests.
 */
import { useState } from 'react'
import { utilsApi } from '../api/client'
import type { StatsResponse } from '../types'

export default function StatsPanel() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await utilsApi.stats()
      setStats(res.data)
    } finally {
      setLoading(false)
    }
  }

  const reset = async () => {
    await utilsApi.reset()
    setStats(null)
    window.location.reload()
  }

  return (
    <div className="bg-white rounded-xl border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800">Server Stats</h2>
        <div className="flex gap-2">
          <button onClick={fetchStats} disabled={loading}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loading ? '…' : 'GET /api/stats'}
          </button>
          <button onClick={reset}
            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
            POST /api/reset
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
        <strong>Stateful server data:</strong> These numbers exist only in server memory.
        The client doesn't track them — it asks the server, which computes them from its own state.
        The <code>requests_handled</code> counter is especially interesting: the client never
        sends this value, the server increments it internally on every request.
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Total Items" value={stats.total_items} color="blue" />
          <StatBox label="Total Quantity" value={stats.total_quantity} color="green" />
          <StatBox label="Total Value" value={`$${stats.total_value.toFixed(2)}`} color="purple" />
          <StatBox label="Requests Handled" value={stats.requests_handled} color="orange"
            note="server-side counter only" />

          <div className="col-span-2">
            <p className="text-xs font-semibold text-gray-600 mb-2">By Category</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.by_category).map(([cat, count]) => (
                <span key={cat} className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {cat}: <strong>{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color, note }: {
  label: string; value: string | number; color: string; note?: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
  }
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {note && <p className="text-xs opacity-60 mt-0.5">{note}</p>}
    </div>
  )
}
