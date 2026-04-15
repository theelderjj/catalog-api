import type { Item } from '../types'

const CATEGORY_EMOJI: Record<string, string> = {
  electronics: '💻',
  clothing: '👕',
  furniture: '🪑',
  books: '📚',
  other: '📦',
}

interface Props {
  item: Item
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
}

export default function ItemCard({ item, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{CATEGORY_EMOJI[item.category] ?? '📦'}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{item.name}</h3>
            <span className="text-xs text-gray-400 capitalize">{item.category}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-800">${item.value.toFixed(2)}</p>
          <p className="text-xs text-gray-400">qty: {item.quantity}</p>
        </div>
      </div>

      {item.description && (
        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
      )}

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ID shown for educational purposes */}
      <div className="text-xs text-gray-400 font-mono mb-3 truncate" title={item.id}>
        ID: {item.id}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium"
        >
          Edit (PUT)
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="flex-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
