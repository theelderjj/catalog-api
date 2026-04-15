import { test, expect } from '@playwright/test'
import { API } from '../helpers/api'

/**
 * Health endpoint tests.
 * GET /health — no auth, no state dependency, safe to run without reset.
 */
test.describe('GET /health', () => {
  test('returns 200 OK', async ({ request }) => {
    const res = await request.get(`${API}/health`)
    expect(res.status()).toBe(200)
  })

  test('response body is valid JSON', async ({ request }) => {
    const res = await request.get(`${API}/health`)
    const body = await res.json()
    expect(body).toBeTruthy()
  })

  test('Content-Type is application/json', async ({ request }) => {
    const res = await request.get(`${API}/health`)
    expect(res.headers()['content-type']).toContain('application/json')
  })

  test('is repeatable — idempotent safe endpoint', async ({ request }) => {
    const [r1, r2, r3] = await Promise.all([
      request.get(`${API}/health`),
      request.get(`${API}/health`),
      request.get(`${API}/health`),
    ])
    expect(r1.status()).toBe(200)
    expect(r2.status()).toBe(200)
    expect(r3.status()).toBe(200)
  })
})
