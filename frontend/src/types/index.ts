export type Category = 'electronics' | 'clothing' | 'furniture' | 'books' | 'other'

export interface Item {
  id: string
  name: string
  description: string
  category: Category
  value: number
  quantity: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CreateItemPayload {
  name: string
  description: string
  category: Category
  value: number
  quantity: number
  tags: string[]
}

export interface UpdateItemPayload {
  name?: string
  description?: string
  category?: Category
  value?: number
  quantity?: number
  tags?: string[]
}

export interface StatsResponse {
  total_items: number
  total_quantity: number
  total_value: number
  by_category: Record<string, number>
  requests_handled: number
}

// A captured API call shown in the Request Log
export interface RequestLog {
  id: string
  timestamp: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  requestBody?: unknown
  requestHeaders: Record<string, string>
  responseStatus: number
  responseBody: unknown
  durationMs: number
  isStateful: boolean   // did this mutate server state?
  isIdempotent: boolean // would repeating it change anything extra?
  isSafe: boolean       // does it read-only?
}
