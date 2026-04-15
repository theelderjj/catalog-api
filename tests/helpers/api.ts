/**
 * Shared helpers for catalog-api test suite.
 *
 * All API helpers accept an `APIRequestContext` from Playwright so they work
 * inside any test file without coupling to a specific fixture instance.
 */
import type { APIRequestContext } from '@playwright/test'

export const API = process.env.API_URL ?? 'http://localhost:8080'

// ---------------------------------------------------------------------------
// Types mirroring backend models
// ---------------------------------------------------------------------------

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

export interface CreatePayload {
  name: string
  description?: string
  category?: Category
  value?: number
  quantity?: number
  tags?: string[]
}

export interface UpdatePayload {
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

export interface ErrorResponse {
  error: string
  detail: string
  status: number
}

// ---------------------------------------------------------------------------
// Reset — call in beforeEach to guarantee a clean state
// ---------------------------------------------------------------------------

export async function resetStore(request: APIRequestContext): Promise<void> {
  const res = await request.post(`${API}/api/reset`)
  if (!res.ok()) {
    throw new Error(`resetStore failed: ${res.status()} ${await res.text()}`)
  }
}

// ---------------------------------------------------------------------------
// Seed-data helpers — reference the 5 demo items by name
// ---------------------------------------------------------------------------

export const SEED_NAMES = [
  'MacBook Pro',
  'Sony WH-1000XM5',
  'Standing Desk',
  'The Pragmatic Programmer',
  'Nike Air Max 270',
]

export const SEED_CATEGORIES: Record<string, Category> = {
  'MacBook Pro': 'electronics',
  'Sony WH-1000XM5': 'electronics',
  'Standing Desk': 'furniture',
  'The Pragmatic Programmer': 'books',
  'Nike Air Max 270': 'clothing',
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

export async function listItems(
  request: APIRequestContext,
  category?: string,
): Promise<Item[]> {
  const url = category ? `${API}/api/items?category=${category}` : `${API}/api/items`
  const res = await request.get(url)
  return res.json()
}

export async function getItem(request: APIRequestContext, id: string) {
  return request.get(`${API}/api/items/${id}`)
}

export async function createItem(request: APIRequestContext, data: CreatePayload) {
  return request.post(`${API}/api/items`, { data })
}

export async function updateItem(
  request: APIRequestContext,
  id: string,
  data: UpdatePayload,
) {
  return request.put(`${API}/api/items/${id}`, { data })
}

export async function deleteItem(request: APIRequestContext, id: string) {
  return request.delete(`${API}/api/items/${id}`)
}

export async function getStats(request: APIRequestContext) {
  return request.get(`${API}/api/stats`)
}

/** Create an item and return the parsed body — throws if creation fails. */
export async function createAndGetItem(
  request: APIRequestContext,
  data: CreatePayload,
): Promise<Item> {
  const res = await createItem(request, data)
  if (!res.ok()) {
    throw new Error(`createAndGetItem failed: ${res.status()} ${await res.text()}`)
  }
  return res.json()
}

/** Minimal valid create payload for tests that don't care about specific values. */
export function minimalItem(overrides: Partial<CreatePayload> = {}): CreatePayload {
  return {
    name: `Test Item ${Date.now()}`,
    description: 'Created by Playwright',
    category: 'other',
    value: 9.99,
    quantity: 1,
    tags: [],
    ...overrides,
  }
}
