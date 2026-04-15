import { useEffect, useState } from 'react'
import { itemsApi } from '../api/client'
import ItemCard from '../components/ItemCard'
import ItemForm from '../components/ItemForm'
import StatsPanel from '../components/StatsPanel'
import type { Category, CreateItemPayload, Item, UpdateItemPayload } from '../types'

const CATEGORIES: (Category | 'all')[] = ['all', 'electronics', 'clothing', 'furniture', 'books', 'other']

type Modal = { type: 'create' } | { type: 'edit'; item: Item } | null

export default function CatalogPage() {
  const [items, setItems]         = useState<Item[]>([])
  const [filter, setFilter]       = useState<Category | 'all'>('all')
  const [modal, setModal]         = useState<Modal>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const load = async (category?: Category) => {
    setLoading(true)
    setError(null)
    try {
      const res = await itemsApi.list(category)
      setItems(res.data)
    } catch {
      setError('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(filter === 'all' ? undefined : filter)
  }, [filter])

  const handleCreate = async (data: CreateItemPayload | UpdateItemPayload) => {
    await itemsApi.create(data as CreateItemPayload)
    setModal(null)
    load(filter === 'all' ? undefined : filter)
  }

  const handleUpdate = async (id: string, data: CreateItemPayload | UpdateItemPayload) => {
    await itemsApi.update(id, data as UpdateItemPayload)
    setModal(null)
    load(filter === 'all' ? undefined : filter)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item? This sends DELETE /api/items/' + id)) return
    await itemsApi.delete(id)
    load(filter === 'all' ? undefined : filter)
  }

  return (
    <div className="space-y-6">
      <StatsPanel />

      {/* Header + actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Item Catalog</h1>
          <p className="text-sm text-gray-500">{items.length} items</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Add Item (POST)
        </button>
      </div>

      {/* Category filter — each click fires a GET request */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === c
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Item grid */}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No items found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <ItemCard key={item.id} item={item}
              onEdit={item => setModal({ type: 'edit', item })}
              onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">
              {modal.type === 'create' ? 'Add New Item' : `Edit: ${modal.item.name}`}
            </h2>
            <ItemForm
              initial={modal.type === 'edit' ? modal.item : undefined}
              onSubmit={modal.type === 'create'
                ? handleCreate
                : data => handleUpdate(modal.item.id, data)}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
