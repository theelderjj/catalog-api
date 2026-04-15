/**
 * api/client.ts
 *
 * Axios instance with request/response interceptors that capture every API
 * call into a log store for the visual Request Log component.
 *
 * EDUCATIONAL: This is a great example of the "middleware" pattern on the
 * client side — every request and response flows through these interceptors
 * before reaching your components.
 */

import axios from 'axios'
import type { RequestLog } from '../types'

// ── Log store ──────────────────────────────────────────────────────────────
// Simple pub/sub log so components can subscribe to new request events.
type Listener = (log: RequestLog) => void
const listeners: Listener[] = []

export function subscribeToLogs(fn: Listener) {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx > -1) listeners.splice(idx, 1)
  }
}

function emit(log: RequestLog) {
  listeners.forEach(fn => fn(log))
}

// ── HTTP method metadata ───────────────────────────────────────────────────
const METHOD_META: Record<string, Pick<RequestLog, 'isStateful' | 'isIdempotent' | 'isSafe'>> = {
  GET:    { isSafe: true,  isIdempotent: true,  isStateful: false },
  POST:   { isSafe: false, isIdempotent: false, isStateful: true  },
  PUT:    { isSafe: false, isIdempotent: true,  isStateful: true  },
  DELETE: { isSafe: false, isIdempotent: true,  isStateful: true  },
}

// ── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: record start time
api.interceptors.request.use(config => {
  (config as any)._startTime = performance.now()
  return config
})

// Response interceptor: build and emit a RequestLog entry
api.interceptors.response.use(
  response => {
    const method = (response.config.method ?? 'GET').toUpperCase()
    const duration = Math.round(performance.now() - (response.config as any)._startTime)
    const meta = METHOD_META[method] ?? METHOD_META['GET']

    emit({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      method: method as RequestLog['method'],
      url: response.config.url ?? '',
      requestBody: response.config.data ? JSON.parse(response.config.data) : undefined,
      requestHeaders: { 'Content-Type': 'application/json' },
      responseStatus: response.status,
      responseBody: response.data,
      durationMs: duration,
      ...meta,
    })
    return response
  },
  error => {
    if (error.response) {
      const method = (error.config?.method ?? 'GET').toUpperCase()
      const duration = Math.round(performance.now() - (error.config as any)?._startTime ?? 0)
      const meta = METHOD_META[method] ?? METHOD_META['GET']

      emit({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        method: method as RequestLog['method'],
        url: error.config?.url ?? '',
        requestBody: error.config?.data ? JSON.parse(error.config.data) : undefined,
        requestHeaders: { 'Content-Type': 'application/json' },
        responseStatus: error.response.status,
        responseBody: error.response.data,
        durationMs: duration,
        ...meta,
      })
    }
    return Promise.reject(error)
  }
)

// ── API methods ────────────────────────────────────────────────────────────
import type { Item, CreateItemPayload, UpdateItemPayload, StatsResponse } from '../types'

export const itemsApi = {
  list:   (category?: string) =>
    api.get<Item[]>('/api/items', { params: category ? { category } : undefined }),
  get:    (id: string) => api.get<Item>(`/api/items/${id}`),
  create: (data: CreateItemPayload) => api.post<Item>('/api/items', data),
  update: (id: string, data: UpdateItemPayload) => api.put<Item>(`/api/items/${id}`, data),
  delete: (id: string) => api.delete(`/api/items/${id}`),
}

export const utilsApi = {
  stats: () => api.get<StatsResponse>('/api/stats'),
  reset: () => api.post('/api/reset'),
  health: () => api.get('/health'),
}

export default api
