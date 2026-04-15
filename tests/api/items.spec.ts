import { test, expect } from '@playwright/test'
import {
  API,
  resetStore,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  createAndGetItem,
  minimalItem,
  SEED_NAMES,
  type Item,
  type ErrorResponse,
} from '../helpers/api'

// ---------------------------------------------------------------------------
// Reset before every test — in-memory store ensures clean, predictable state.
// ---------------------------------------------------------------------------
test.beforeEach(async ({ request }) => {
  await resetStore(request)
})

// ============================================================================
// LIST ITEMS — GET /api/items
// ============================================================================

test.describe('GET /api/items', () => {
  test('returns 200 with an array', async ({ request }) => {
    const res = await request.get(`${API}/api/items`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('returns the 5 seed items after reset', async ({ request }) => {
    const items = await listItems(request)
    expect(items).toHaveLength(5)
  })

  test('each item has required shape', async ({ request }) => {
    const items = await listItems(request)
    for (const item of items) {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('name')
      expect(item).toHaveProperty('description')
      expect(item).toHaveProperty('category')
      expect(item).toHaveProperty('value')
      expect(item).toHaveProperty('quantity')
      expect(item).toHaveProperty('tags')
      expect(item).toHaveProperty('created_at')
      expect(item).toHaveProperty('updated_at')
    }
  })

  test('seed item names match expected demo data', async ({ request }) => {
    const items = await listItems(request)
    const names = items.map((i: Item) => i.name)
    for (const seed of SEED_NAMES) {
      expect(names).toContain(seed)
    }
  })

  test('tags is always an array (not null)', async ({ request }) => {
    const items = await listItems(request)
    for (const item of items) {
      expect(Array.isArray(item.tags)).toBe(true)
    }
  })

  test('Content-Type is application/json', async ({ request }) => {
    const res = await request.get(`${API}/api/items`)
    expect(res.headers()['content-type']).toContain('application/json')
  })

  test('is safe — two identical GET calls return same length', async ({ request }) => {
    const [a, b] = await Promise.all([
      listItems(request),
      listItems(request),
    ])
    expect(a).toHaveLength(b.length)
  })
})

// ============================================================================
// LIST WITH CATEGORY FILTER — GET /api/items?category=
// ============================================================================

test.describe('GET /api/items?category=', () => {
  test('filters to electronics only', async ({ request }) => {
    const items = await listItems(request, 'electronics')
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.category).toBe('electronics')
    }
  })

  test('filters to books only', async ({ request }) => {
    const items = await listItems(request, 'books')
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.category).toBe('books')
    }
  })

  test('filters to furniture only', async ({ request }) => {
    const items = await listItems(request, 'furniture')
    for (const item of items) {
      expect(item.category).toBe('furniture')
    }
  })

  test('filter is case-insensitive (ELECTRONICS matches electronics)', async ({ request }) => {
    const lower = await listItems(request, 'electronics')
    const upper = await listItems(request, 'ELECTRONICS')
    expect(upper).toHaveLength(lower.length)
  })

  test('unknown category returns empty array, not 404', async ({ request }) => {
    const res = await request.get(`${API}/api/items?category=nonexistent`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })

  test('empty category param returns all items', async ({ request }) => {
    const all = await listItems(request)
    const filtered = await listItems(request, '')
    expect(filtered).toHaveLength(all.length)
  })

  test('category filter reflects newly created items', async ({ request }) => {
    await createAndGetItem(request, minimalItem({ category: 'clothing', name: 'New Shirt' }))
    const items = await listItems(request, 'clothing')
    const names = items.map((i: Item) => i.name)
    expect(names).toContain('New Shirt')
  })
})

// ============================================================================
// GET SINGLE ITEM — GET /api/items/{id}
// ============================================================================

test.describe('GET /api/items/{id}', () => {
  test('returns 200 with the item when found', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem({ name: 'Fetchable' }))
    const res = await getItem(request, created.id)
    expect(res.status()).toBe(200)
    const body: Item = await res.json()
    expect(body.id).toBe(created.id)
    expect(body.name).toBe('Fetchable')
  })

  test('returns 404 for unknown id', async ({ request }) => {
    const res = await getItem(request, 'doesnotexist000000')
    expect(res.status()).toBe(404)
  })

  test('404 response has error shape', async ({ request }) => {
    const res = await getItem(request, 'doesnotexist')
    const body: ErrorResponse = await res.json()
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('detail')
    expect(body).toHaveProperty('status')
    expect(body.status).toBe(404)
  })

  test('returned item matches creation payload exactly', async ({ request }) => {
    const payload = minimalItem({
      name: 'Exact Match',
      description: 'Exact description',
      category: 'books',
      value: 19.99,
      quantity: 3,
      tags: ['fiction', 'bestseller'],
    })
    const created = await createAndGetItem(request, payload)
    const res = await getItem(request, created.id)
    const fetched: Item = await res.json()

    expect(fetched.name).toBe(payload.name)
    expect(fetched.description).toBe(payload.description)
    expect(fetched.category).toBe(payload.category)
    expect(fetched.value).toBe(payload.value)
    expect(fetched.quantity).toBe(payload.quantity)
    expect(fetched.tags).toEqual(payload.tags)
  })

  test('id in URL matches id in response body', async ({ request }) => {
    // Create a known item so no other test's reset can delete it between calls.
    const created = await createAndGetItem(request, minimalItem({ name: 'ID Match Test' }))
    const res = await getItem(request, created.id)
    const body: Item = await res.json()
    expect(body.id).toBe(created.id)
  })
})

// ============================================================================
// CREATE ITEM — POST /api/items
// ============================================================================

test.describe('POST /api/items', () => {
  test('returns 201 Created', async ({ request }) => {
    const res = await createItem(request, minimalItem())
    expect(res.status()).toBe(201)
  })

  test('response body has the new item', async ({ request }) => {
    const payload = minimalItem({ name: 'Brand New' })
    const res = await createItem(request, payload)
    const body: Item = await res.json()
    expect(body.name).toBe('Brand New')
    expect(body.id).toBeTruthy()
  })

  test('server generates a non-empty id', async ({ request }) => {
    const item = await createAndGetItem(request, minimalItem())
    expect(item.id).toBeTruthy()
    expect(item.id.length).toBeGreaterThan(0)
  })

  test('server sets created_at and updated_at timestamps', async ({ request }) => {
    const item = await createAndGetItem(request, minimalItem())
    expect(new Date(item.created_at).getTime()).toBeGreaterThan(0)
    expect(new Date(item.updated_at).getTime()).toBeGreaterThan(0)
  })

  test('response includes Location header pointing to new item', async ({ request }) => {
    const res = await createItem(request, minimalItem())
    const location = res.headers()['location']
    expect(location).toMatch(/^\/api\/items\//)
  })

  test('Location header id matches response body id', async ({ request }) => {
    const res = await createItem(request, minimalItem())
    const body: Item = await res.json()
    const location = res.headers()['location']
    expect(location).toBe(`/api/items/${body.id}`)
  })

  test('new item appears in the list', async ({ request }) => {
    const item = await createAndGetItem(request, minimalItem({ name: 'Listed Item' }))
    const items = await listItems(request)
    expect(items.map((i: Item) => i.id)).toContain(item.id)
  })

  test('total item count increases by 1', async ({ request }) => {
    const before = await listItems(request)
    await createAndGetItem(request, minimalItem())
    const after = await listItems(request)
    expect(after).toHaveLength(before.length + 1)
  })

  test('two consecutive creates produce unique ids', async ({ request }) => {
    const [a, b] = await Promise.all([
      createAndGetItem(request, minimalItem({ name: 'Alpha' })),
      createAndGetItem(request, minimalItem({ name: 'Beta' })),
    ])
    expect(a.id).not.toBe(b.id)
  })

  // ---- Validation ----

  test('returns 422 when name is missing', async ({ request }) => {
    const res = await createItem(request, { description: 'no name' } as any)
    expect(res.status()).toBe(422)
  })

  test('returns 422 when name is empty string', async ({ request }) => {
    const res = await createItem(request, minimalItem({ name: '' }))
    expect(res.status()).toBe(422)
  })

  test('422 response body has error, detail, status fields', async ({ request }) => {
    const res = await createItem(request, { description: 'no name' } as any)
    const body: ErrorResponse = await res.json()
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('detail')
    expect(body.status).toBe(422)
  })

  test('returns 400 for malformed JSON', async ({ request }) => {
    const res = await request.post(`${API}/api/items`, {
      data: '{not: valid json',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(400)
  })

  // ---- Default values ----

  test('defaults category to "other" when not provided', async ({ request }) => {
    const res = await createItem(request, { name: 'No Category' })
    const body: Item = await res.json()
    expect(body.category).toBe('other')
  })

  test('defaults quantity to 1 when not provided', async ({ request }) => {
    const res = await createItem(request, { name: 'No Qty' })
    const body: Item = await res.json()
    expect(body.quantity).toBe(1)
  })

  test('defaults quantity to 1 when quantity is 0', async ({ request }) => {
    const res = await createItem(request, minimalItem({ quantity: 0 }))
    const body: Item = await res.json()
    expect(body.quantity).toBe(1)
  })

  test('defaults quantity to 1 when quantity is negative', async ({ request }) => {
    const res = await createItem(request, minimalItem({ quantity: -5 }))
    const body: Item = await res.json()
    expect(body.quantity).toBe(1)
  })

  test('defaults tags to empty array when not provided', async ({ request }) => {
    const res = await createItem(request, { name: 'No Tags' })
    const body: Item = await res.json()
    expect(Array.isArray(body.tags)).toBe(true)
    expect(body.tags).toHaveLength(0)
  })

  // ---- All categories accepted ----

  const categories = ['electronics', 'clothing', 'furniture', 'books', 'other'] as const
  for (const cat of categories) {
    test(`accepts category "${cat}"`, async ({ request }) => {
      const res = await createItem(request, minimalItem({ category: cat, name: `${cat} item` }))
      expect(res.status()).toBe(201)
      const body: Item = await res.json()
      expect(body.category).toBe(cat)
    })
  }

  // ---- Special characters ----

  test('handles special characters in name and description', async ({ request }) => {
    const payload = minimalItem({
      name: 'Café & Résumé — "The Best" <item>',
      description: 'Symbols: © ® ™ & < > " \' /',
    })
    const res = await createItem(request, payload)
    expect(res.status()).toBe(201)
    const body: Item = await res.json()
    expect(body.name).toBe(payload.name)
    expect(body.description).toBe(payload.description)
  })

  test('handles large float value without precision loss', async ({ request }) => {
    const item = await createAndGetItem(request, minimalItem({ value: 12345.99 }))
    expect(item.value).toBeCloseTo(12345.99, 2)
  })

  test('stores multiple tags correctly', async ({ request }) => {
    const tags = ['laptop', 'apple', 'pro', 'refurbished']
    const item = await createAndGetItem(request, minimalItem({ tags }))
    expect(item.tags).toEqual(tags)
  })
})

// ============================================================================
// UPDATE ITEM — PUT /api/items/{id}
// ============================================================================

test.describe('PUT /api/items/{id}', () => {
  test('returns 200 with the updated item', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem({ name: 'Original' }))
    const res = await updateItem(request, created.id, { name: 'Updated' })
    expect(res.status()).toBe(200)
    const body: Item = await res.json()
    expect(body.name).toBe('Updated')
  })

  test('returns 404 for unknown id', async ({ request }) => {
    const res = await updateItem(request, 'doesnotexist', { name: 'x' })
    expect(res.status()).toBe(404)
  })

  test('returns 400 for malformed JSON', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem())
    const res = await request.put(`${API}/api/items/${created.id}`, {
      data: 'not json at all',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(400)
  })

  test('partial update — only name changes, other fields preserved', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem({
      name: 'Keep Me',
      category: 'books',
      value: 49.99,
      quantity: 7,
      tags: ['classic'],
    }))

    const res = await updateItem(request, created.id, { name: 'Renamed' })
    const updated: Item = await res.json()

    expect(updated.name).toBe('Renamed')
    expect(updated.category).toBe(created.category)
    expect(updated.value).toBe(created.value)
    expect(updated.quantity).toBe(created.quantity)
    expect(updated.tags).toEqual(created.tags)
  })

  test('can update only the value', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem({ value: 10 }))
    const res = await updateItem(request, created.id, { value: 999.99 })
    const updated: Item = await res.json()
    expect(updated.value).toBeCloseTo(999.99, 2)
    expect(updated.name).toBe(created.name)
  })

  test('can update only the category', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem({ category: 'other' }))
    const res = await updateItem(request, created.id, { category: 'electronics' })
    const updated: Item = await res.json()
    expect(updated.category).toBe('electronics')
  })

  test('can update only the tags', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem({ tags: ['old'] }))
    const res = await updateItem(request, created.id, { tags: ['new', 'tags'] })
    const updated: Item = await res.json()
    expect(updated.tags).toEqual(['new', 'tags'])
  })

  test('updated_at advances after update', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem())
    // Small delay to ensure clock advances
    await new Promise(r => setTimeout(r, 10))
    const res = await updateItem(request, created.id, { name: 'Newer Name' })
    const updated: Item = await res.json()
    expect(new Date(updated.updated_at).getTime())
      .toBeGreaterThanOrEqual(new Date(created.updated_at).getTime())
  })

  test('created_at does NOT change on update', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem())
    const res = await updateItem(request, created.id, { name: 'New Name' })
    const updated: Item = await res.json()
    expect(updated.created_at).toBe(created.created_at)
  })

  test('update is reflected in GET /api/items list', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem({ name: 'Before' }))
    await updateItem(request, created.id, { name: 'After' })
    const items = await listItems(request)
    const found = items.find((i: Item) => i.id === created.id)
    expect(found?.name).toBe('After')
  })

  test('is idempotent — sending same PUT twice produces same result', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem())
    const payload = { name: 'Idempotent Name', value: 42.0 }

    const [r1, r2] = await Promise.all([
      updateItem(request, created.id, payload),
      updateItem(request, created.id, payload),
    ])

    const b1: Item = await r1.json()
    const b2: Item = await r2.json()

    // Both succeed with 200
    expect(r1.status()).toBe(200)
    expect(r2.status()).toBe(200)
    // Both return the same final state
    expect(b1.name).toBe(b2.name)
    expect(b1.value).toBe(b2.value)
  })

  test('empty body update does not crash the server', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem())
    const res = await updateItem(request, created.id, {})
    expect(res.status()).toBe(200)
  })
})

// ============================================================================
// DELETE ITEM — DELETE /api/items/{id}
// ============================================================================

test.describe('DELETE /api/items/{id}', () => {
  test('returns 204 No Content on success', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem())
    const res = await deleteItem(request, created.id)
    expect(res.status()).toBe(204)
  })

  test('returns 404 for unknown id', async ({ request }) => {
    const res = await deleteItem(request, 'doesnotexist')
    expect(res.status()).toBe(404)
  })

  test('204 response has no body', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem())
    const res = await deleteItem(request, created.id)
    const text = await res.text()
    expect(text).toBeFalsy()
  })

  test('deleted item no longer appears in list', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem({ name: 'Deleted' }))
    await deleteItem(request, created.id)
    const items = await listItems(request)
    expect(items.map((i: Item) => i.id)).not.toContain(created.id)
  })

  test('GET on deleted id returns 404', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem())
    await deleteItem(request, created.id)
    const res = await getItem(request, created.id)
    expect(res.status()).toBe(404)
  })

  test('total item count decreases by 1', async ({ request }) => {
    const before = await listItems(request)
    const created = await createAndGetItem(request, minimalItem())
    await deleteItem(request, created.id)
    const after = await listItems(request)
    expect(after).toHaveLength(before.length)
  })

  test('is idempotent in intent — second delete returns 404, not 500', async ({ request }) => {
    const created = await createAndGetItem(request, minimalItem())
    await deleteItem(request, created.id)
    const second = await deleteItem(request, created.id)
    // Server correctly reports the item was already gone — 404, not crash
    expect(second.status()).toBe(404)
  })

  test('deleting one item does not affect others', async ({ request }) => {
    const a = await createAndGetItem(request, minimalItem({ name: 'Keep A' }))
    const b = await createAndGetItem(request, minimalItem({ name: 'Delete B' }))
    await deleteItem(request, b.id)
    const res = await getItem(request, a.id)
    expect(res.status()).toBe(200)
  })
})
