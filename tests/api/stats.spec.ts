import { test, expect } from '@playwright/test'
import {
  API,
  resetStore,
  getStats,
  listItems,
  createAndGetItem,
  deleteItem,
  minimalItem,
  type StatsResponse,
  type Item,
} from '../helpers/api'

test.beforeEach(async ({ request }) => {
  await resetStore(request)
})

// ============================================================================
// GET /api/stats
// ============================================================================

test.describe('GET /api/stats', () => {
  test('returns 200 OK', async ({ request }) => {
    const res = await getStats(request)
    expect(res.status()).toBe(200)
  })

  test('response has all required fields', async ({ request }) => {
    const res = await getStats(request)
    const body: StatsResponse = await res.json()
    expect(body).toHaveProperty('total_items')
    expect(body).toHaveProperty('total_quantity')
    expect(body).toHaveProperty('total_value')
    expect(body).toHaveProperty('by_category')
    expect(body).toHaveProperty('requests_handled')
  })

  test('by_category is an object', async ({ request }) => {
    const res = await getStats(request)
    const body: StatsResponse = await res.json()
    expect(typeof body.by_category).toBe('object')
    expect(body.by_category).not.toBeNull()
  })

  test('total_items matches actual item count after reset', async ({ request }) => {
    const items = await listItems(request)
    const res = await getStats(request)
    const body: StatsResponse = await res.json()
    expect(body.total_items).toBe(items.length)
  })

  test('total_quantity is the sum of all item quantities', async ({ request }) => {
    const items = await listItems(request)
    const expectedQty = items.reduce((sum: number, i: Item) => sum + i.quantity, 0)
    const res = await getStats(request)
    const body: StatsResponse = await res.json()
    expect(body.total_quantity).toBe(expectedQty)
  })

  test('total_value is the sum of all item values', async ({ request }) => {
    const items = await listItems(request)
    const expectedValue = items.reduce((sum: number, i: Item) => sum + i.value, 0)
    const res = await getStats(request)
    const body: StatsResponse = await res.json()
    expect(body.total_value).toBeCloseTo(expectedValue, 2)
  })

  test('by_category counts match filtering results', async ({ request }) => {
    const res = await getStats(request)
    const body: StatsResponse = await res.json()
    const items = await listItems(request)

    for (const [cat, count] of Object.entries(body.by_category)) {
      const actual = items.filter((i: Item) => i.category === cat).length
      expect(count).toBe(actual)
    }
  })

  test('total_items increases by 1 after creating an item', async ({ request }) => {
    const before = (await (await getStats(request)).json()) as StatsResponse
    await createAndGetItem(request, minimalItem({ name: 'Stats Test Item' }))
    const after = (await (await getStats(request)).json()) as StatsResponse
    expect(after.total_items).toBe(before.total_items + 1)
  })

  test('total_items decreases by 1 after deleting an item', async ({ request }) => {
    const item = await createAndGetItem(request, minimalItem())
    const before = (await (await getStats(request)).json()) as StatsResponse
    await deleteItem(request, item.id)
    const after = (await (await getStats(request)).json()) as StatsResponse
    expect(after.total_items).toBe(before.total_items - 1)
  })

  test('total_value increases after creating a high-value item', async ({ request }) => {
    const before = (await (await getStats(request)).json()) as StatsResponse
    await createAndGetItem(request, minimalItem({ value: 10000 }))
    const after = (await (await getStats(request)).json()) as StatsResponse
    expect(after.total_value).toBeCloseTo(before.total_value + 10000, 2)
  })

  test('by_category reflects newly created item category', async ({ request }) => {
    // Count clothing before
    const before = (await (await getStats(request)).json()) as StatsResponse
    const clothingBefore = before.by_category['clothing'] ?? 0

    await createAndGetItem(request, minimalItem({ category: 'clothing', name: 'New Shirt' }))

    const after = (await (await getStats(request)).json()) as StatsResponse
    expect(after.by_category['clothing']).toBe(clothingBefore + 1)
  })

  test('requests_handled increments on each request', async ({ request }) => {
    const r1 = (await (await getStats(request)).json()) as StatsResponse
    // Make a few more requests
    await request.get(`${API}/api/items`)
    await request.get(`${API}/api/items`)
    const r2 = (await (await getStats(request)).json()) as StatsResponse
    // r2 should show more requests than r1 (at least 3 more — 2 list + 1 stats)
    expect(r2.requests_handled).toBeGreaterThan(r1.requests_handled)
  })

  test('requests_handled is a positive integer', async ({ request }) => {
    const res = await getStats(request)
    const body: StatsResponse = await res.json()
    expect(body.requests_handled).toBeGreaterThan(0)
    expect(Number.isInteger(body.requests_handled)).toBe(true)
  })

  test('stats are consistent across two immediate calls', async ({ request }) => {
    const [r1, r2] = await Promise.all([
      getStats(request),
      getStats(request),
    ])
    const b1: StatsResponse = await r1.json()
    const b2: StatsResponse = await r2.json()
    // Item counts and values should be the same — only requests_handled may differ by 1-2
    expect(b1.total_items).toBe(b2.total_items)
    expect(b1.total_value).toBeCloseTo(b2.total_value, 2)
  })
})
