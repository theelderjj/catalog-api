import { useState } from 'react'
import type { Category, CreateItemPayload, Item, UpdateItemPayload } from '../types'

const CATEGORIES: Category[] = ['electronics', 'clothing', 'furniture', 'books', 'other']

interface Props {
  initial?: Item
  onSubmit: (data: CreateItemPayload | UpdateItemPayload) => Promise<void>
  onCancel: () => void
}

export default function ItemForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName]           = useState(initial?.name ?? '')
  const [description, setDesc]    = useState(initial?.description ?? '')
  const [category, setCategory]   = useState<Category>(initial?.category ?? 'other')
  const [value, setValue]         = useState(String(initial?.value ?? 0))
  const [quantity, setQuantity]   = useState(String(initial?.quantity ?? 1))
  const [tags, setTags]           = useState(initial?.tags.join(', ') ?? '')
  const [loading, setLoading]     = useState(false)

  const isEdit = !!initial

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        name,
        description,
        category,
        value: parseFloat(value) || 0,
        quantity: parseInt(quantity) || 1,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <strong>{isEdit ? 'PUT request' : 'POST request'}</strong> — {isEdit
          ? 'Updates this item. Idempotent: sending the same form twice gives the same result.'
          : 'Creates a new item. Not idempotent: submitting twice creates two items.'}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as Category)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value ($)</label>
          <input type="number" min="0" step="0.01" value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
        <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="laptop, apple, work"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Saving…' : isEdit ? 'Update Item (PUT)' : 'Create Item (POST)'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}
