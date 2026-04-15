import { test, expect } from '@playwright/test'
import {
  API,
  resetStore,
  listItems,
  createAndGetItem,
  getStats,
  minimalItem,
  SEED_NAMES,
  type Item,
  type StatsResponse,
} from '../helpers/api'

test.beforeEach(async ({ request }) => {
  await resetStore(request)
})

// ============================================================================
// POST /api/reset
// ============================================================================

test.describe('POST /api/reset', () => {
  test('returns 200 OK', async ({ request }) => {
    const res = await request.post(`${API}/api/reset`)
    expect(res.status()).toBe(200)
  })

  test('response body has a message field', async ({ request }) => {
    const res = await request.post(`${API}/api/reset`)
    const body = await res.json()
    expect(body).toHaveProperty('message')
    expect(typeof body.message).toBe('string')
  })

  test('restores exactly 5 seed items', async ({ request }) => {
    // Add extra items
    await createAndGetItem(request, minimalItem({ name: 'Extra A' }))
    await createAndGetItem(request, minimalItem({ name: 'Extra B' }))

    // Verify we now have 7
    const before = await listItems(request)
    expect(before.length).toBeGreaterThan(5)

    // Reset
    await request.post(`${API}/api/reset`)
    const after = await listItems(request)
    expect(after).toHaveLength(5)
  })

  test('restores all original seed item names', async ({ request }) => {
    // Wipe everything by deleting all items then resetting
    await request.post(`${API}/api/reset`)
    const items = await listItems(request)
    const names = items.map((i: Item) => i.name)
    for (const seed of SEED_NAMES) {
      expect(names).toContain(seed)
    }
  })

  test('removes any items created after the previous reset', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem({ name: 'Should Be Gone' }))
    await request.post(`${API}/api/reset`)
    const items = await listItems(request)
    expect(items.map((i: Item) => i.id)).not.toContain(created.id)
  })

  test('stats reflect the reset state', async ({ request }) => {
    // Create items then reset
    await createAndGetItem(request, minimalItem({ value: 99999 }))
    await request.post(`${API}/api/reset`)

    const res = await getStats(request)
    const stats: StatsResponse = await res.json()
    expect(stats.total_items).toBe(5)
  })

  test('is idempotent — two resets produce the same state', async ({ request }) => {
    await request.post(`${API}/api/reset`)
    const first = await listItems(request)

    await request.post(`${API}/api/reset`)
    const second = await listItems(request)

    expect(second).toHaveLength(first.length)
    const firstNames = first.map((i: Item) => i.name).sort()
    const secondNames = second.map((i: Item) => i.name).sort()
    expect(secondNames).toEqual(firstNames)
  })

  test('seed items have valid categories', async ({ request }) => {
    const validCategories = ['electronics', 'clothing', 'furniture', 'books', 'other']
    const items = await listItems(request)
    for (const item of items) {
      expect(validCategories).toContain(item.category)
    }
  })

  test('seed items have positive values', async ({ request }) => {
    const items = await listItems(request)
    for (const item of items) {
      expect(item.value).toBeGreaterThan(0)
    }
  })

  test('seed items have positive quantities', async ({ request }) => {
    const items = await listItems(request)
    for (const item of items) {
      expect(item.quantity).toBeGreaterThan(0)
    }
  })
})
