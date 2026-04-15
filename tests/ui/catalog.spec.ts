import { test, expect, type Page } from '@playwright/test'
import { API, resetStore } from '../helpers/api'

// ---------------------------------------------------------------------------
// Reset API state before every test so the UI starts from a known baseline.
// ---------------------------------------------------------------------------
test.beforeEach(async ({ page, request }) => {
  await resetStore(request)
  await page.goto('/')
  // Wait until the item grid has populated — guards against race conditions.
  await page.waitForSelector('h3', { timeout: 10_000 })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Selectors for the ItemForm modal fields.
 *
 * ItemForm renders plain <label> text with no `for`/htmlFor and inputs with
 * no `id`, so Playwright's `getByLabel` cannot associate them. We use unique
 * input attributes instead:
 *   - Name:        the only `required` input in the form
 *   - Description: the only <textarea>
 *   - Category:    the only <select>
 *   - Value:       number input with step="0.01"
 *   - Quantity:    number input with min="1"
 *   - Tags:        input with the "laptop, apple, work" placeholder
 */
function formFields(page: Page) {
  return {
    name:        page.locator('input[required]'),
    description: page.locator('textarea'),
    category:    page.locator('select'),
    value:       page.locator('input[step="0.01"]'),
    quantity:    page.locator('input[min="1"][type="number"]'),
    tags:        page.locator('input[placeholder="laptop, apple, work"]'),
  }
}

/**
 * Clicks a button associated with a specific item card.
 *
 * Items render as a flat list: h3 elements and button pairs are in the same
 * document order. Finding the index of the item name in all h3 elements and
 * using that index on the button collection is robust regardless of nesting
 * depth or CSS class names on ancestor containers.
 */
async function clickCardButton(
  page: Page,
  itemName: string,
  buttonName: string | RegExp,
) {
  const names = await page.locator('h3').allTextContents()
  const idx = names.findIndex(n => n.trim() === itemName)
  if (idx === -1) throw new Error(`Item "${itemName}" not found in card list`)
  await page.getByRole('button', { name: buttonName }).nth(idx).click()
}

/**
 * Returns the category label text for a specific item card using the same
 * position-based approach as clickCardButton.
 */
async function getCardCategory(page: Page, itemName: string): Promise<string> {
  const names = await page.locator('h3').allTextContents()
  const idx = names.findIndex(n => n.trim() === itemName)
  if (idx === -1) throw new Error(`Item "${itemName}" not found in card list`)
  return (await page.locator('span.capitalize').nth(idx).textContent()) ?? ''
}

/** Fill and submit the create-item form. */
async function fillAndSubmitCreateForm(
  page: Page,
  opts: {
    name: string
    description?: string
    category?: string
    value?: string
    quantity?: string
    tags?: string
  },
) {
  await page.getByRole('button', { name: /Add Item/i }).click()
  await page.waitForSelector('text=Add New Item')

  const f = formFields(page)
  await f.name.fill(opts.name)
  if (opts.description) await f.description.fill(opts.description)
  if (opts.category)    await f.category.selectOption(opts.category)
  if (opts.value)       await f.value.fill(opts.value)
  if (opts.quantity)    await f.quantity.fill(opts.quantity)
  if (opts.tags)        await f.tags.fill(opts.tags)

  await page.getByRole('button', { name: /Create Item/i }).click()
  // The submit button lives inside the modal — once it's gone the modal is closed,
  // regardless of whether the app uses DOM removal or CSS hiding.
  await expect(page.getByRole('button', { name: /Create Item/i })).not.toBeVisible({ timeout: 10_000 })
}

// ============================================================================
// PAGE LOAD
// ============================================================================

test.describe('Catalog page — initial load', () => {
  test('page title contains Catalog API', async ({ page }) => {
    await expect(page).toHaveTitle(/Catalog API/i)
  })

  test('header shows "📦 Catalog API"', async ({ page }) => {
    await expect(page.getByText('📦 Catalog API')).toBeVisible()
  })

  test('shows catalog tab and concepts tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'catalog' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'concepts' })).toBeVisible()
  })

  test('displays "Item Catalog" heading', async ({ page }) => {
    await expect(page.getByText('Item Catalog')).toBeVisible()
  })

  test('displays item count badge', async ({ page }) => {
    await expect(page.getByText(/\d+ items/)).toBeVisible()
  })

  test('shows 5 seed item cards after reset', async ({ page }) => {
    const cards = page.locator('h3')
    await expect(cards).toHaveCount(5)
  })

  test('shows "+ Add Item (POST)" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Item/i })).toBeVisible()
  })

  test('shows category filter buttons', async ({ page }) => {
    for (const cat of ['all', 'electronics', 'clothing', 'furniture', 'books', 'other']) {
      await expect(page.getByRole('button', { name: cat })).toBeVisible()
    }
  })

  test('seed items are visible by name', async ({ page }) => {
    for (const name of ['MacBook Pro', 'Sony WH-1000XM5', 'Standing Desk', 'The Pragmatic Programmer', 'Nike Air Max 270']) {
      await expect(page.getByText(name)).toBeVisible()
    }
  })

  test('item cards show price', async ({ page }) => {
    // MacBook Pro is $2499
    await expect(page.getByText(/\$2[,.]?499/)).toBeVisible()
  })

  test('item cards show quantity', async ({ page }) => {
    await expect(page.getByText(/qty:/i).first()).toBeVisible()
  })

  test('item cards have Edit and Delete buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Edit/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete' }).first()).toBeVisible()
  })
})

// ============================================================================
// CATEGORY FILTER
// ============================================================================

test.describe('Category filter', () => {
  test('"all" shows all 5 items', async ({ page }) => {
    await page.getByRole('button', { name: 'all' }).click()
    await expect(page.locator('h3')).toHaveCount(5)
  })

  test('electronics filter shows only electronics items', async ({ page }) => {
    await page.getByRole('button', { name: 'electronics' }).click()
    await page.waitForTimeout(300)
    // MacBook Pro and Sony headphones are electronics
    await expect(page.getByText('MacBook Pro')).toBeVisible()
    await expect(page.getByText('Sony WH-1000XM5')).toBeVisible()
    await expect(page.getByText('Standing Desk')).not.toBeVisible()
  })

  test('books filter shows only books items', async ({ page }) => {
    await page.getByRole('button', { name: 'books' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('The Pragmatic Programmer')).toBeVisible()
    await expect(page.locator('h3')).toHaveCount(1)
  })

  test('clothing filter shows only clothing items', async ({ page }) => {
    await page.getByRole('button', { name: 'clothing' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('Nike Air Max 270')).toBeVisible()
    await expect(page.locator('h3')).toHaveCount(1)
  })

  test('furniture filter shows only furniture items', async ({ page }) => {
    await page.getByRole('button', { name: 'furniture' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('Standing Desk')).toBeVisible()
    await expect(page.locator('h3')).toHaveCount(1)
  })

  test('"other" filter shows empty state when no other items exist', async ({ page }) => {
    await page.getByRole('button', { name: 'other' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('No items found')).toBeVisible()
  })

  test('filter then add item in that category — item appears in filter view', async ({ page }) => {
    await fillAndSubmitCreateForm(page, {
      name: 'Filter Test Book',
      category: 'books',
      value: '15',
    })
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'books' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('Filter Test Book')).toBeVisible()
  })

  test('switching back to "all" after filter shows all items again', async ({ page }) => {
    await page.getByRole('button', { name: 'electronics' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'all' }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('h3')).toHaveCount(5)
  })

  test('item count badge updates when filter is applied', async ({ page }) => {
    await page.getByRole('button', { name: 'books' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('1 items')).toBeVisible()
  })
})

// ============================================================================
// CREATE ITEM MODAL
// ============================================================================

test.describe('Create item form', () => {
  test('clicking "+ Add Item" opens the modal', async ({ page }) => {
    await page.getByRole('button', { name: /Add Item/i }).click()
    await expect(page.getByText('Add New Item')).toBeVisible()
  })

  test('modal shows POST request info box', async ({ page }) => {
    await page.getByRole('button', { name: /Add Item/i }).click()
    await expect(page.getByText(/POST request/i)).toBeVisible()
  })

  test('modal has all required form fields', async ({ page }) => {
    await page.getByRole('button', { name: /Add Item/i }).click()
    await page.waitForSelector('text=Add New Item')
    const f = formFields(page)
    await expect(f.name).toBeVisible()
    await expect(f.description).toBeVisible()
    await expect(f.category).toBeVisible()
    await expect(f.value).toBeVisible()
    await expect(f.quantity).toBeVisible()
    await expect(f.tags).toBeVisible()
  })

  test('Cancel button closes the modal', async ({ page }) => {
    await page.getByRole('button', { name: /Add Item/i }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Add New Item')).not.toBeVisible()
  })

  test('creating an item adds it to the list', async ({ page }) => {
    await fillAndSubmitCreateForm(page, { name: 'My New Gadget', category: 'electronics', value: '299' })
    await expect(page.getByText('My New Gadget')).toBeVisible()
  })

  test('new item count is 6 after creating one item', async ({ page }) => {
    await fillAndSubmitCreateForm(page, { name: 'Extra Item', value: '5' })
    await expect(page.getByText('6 items')).toBeVisible()
  })

  test('created item shows the correct price', async ({ page }) => {
    await fillAndSubmitCreateForm(page, { name: 'Price Test', value: '123.45' })
    await expect(page.getByText('$123.45')).toBeVisible()
  })

  test('created item shows the correct category', async ({ page }) => {
    await fillAndSubmitCreateForm(page, { name: 'Book Test', category: 'books', value: '20' })
    // position-based lookup — 'books' text is ambiguous (filter button + other cards)
    //await page.pause()
    await expect(page.locator('h3', { hasText: 'Book Test' })).toBeVisible()
    expect(await getCardCategory(page, 'Book Test')).toBe('books')
  })

  test('modal closes automatically after successful creation', async ({ page }) => {
    await fillAndSubmitCreateForm(page, { name: 'Close Test', value: '10' })
    await expect(page.getByText('Add New Item')).not.toBeVisible()
  })

  test('tags appear on the new item card', async ({ page }) => {
    await fillAndSubmitCreateForm(page, {
      name: 'Tagged Item',
      value: '50',
      tags: 'sale, featured',
    })
    await expect(page.getByText('#sale')).toBeVisible()
    await expect(page.getByText('#featured')).toBeVisible()
  })

  test('creating two items with same name creates two distinct cards', async ({ page }) => {
    await fillAndSubmitCreateForm(page, { name: 'Duplicate Name', value: '10' })
    await fillAndSubmitCreateForm(page, { name: 'Duplicate Name', value: '20' })
    const cards = page.locator('h3', { hasText: 'Duplicate Name' })
    await expect(cards).toHaveCount(2)
  })
})

// ============================================================================
// EDIT ITEM MODAL
// ============================================================================

test.describe('Edit item form', () => {
  test('clicking Edit opens modal with pre-filled name', async ({ page }) => {
    await page.getByRole('button', { name: /Edit/i }).first().click()
    await expect(page.getByText(/^Edit:/)).toBeVisible()
    const nameInput = formFields(page).name
    await expect(nameInput).toBeVisible()
    const value = await nameInput.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })

  test('modal title shows "Edit: {name}"', async ({ page }) => {
    await page.getByRole('button', { name: /Edit/i }).first().click()
    await expect(page.getByText(/^Edit:/)).toBeVisible()
  })

  test('modal shows PUT request info box', async ({ page }) => {
    await page.getByRole('button', { name: /Edit/i }).first().click()
    await expect(page.getByText(/PUT request/i)).toBeVisible()
  })

  test('submit button says "Update Item (PUT)"', async ({ page }) => {
    await page.getByRole('button', { name: /Edit/i }).first().click()
    await expect(page.getByRole('button', { name: /Update Item/i })).toBeVisible()
  })

  test('editing name updates the card', async ({ page }) => {
    await page.getByRole('button', { name: /Edit/i }).first().click()
    await expect(page.getByText(/^Edit:/)).toBeVisible()
    const nameInput = formFields(page).name
    await nameInput.clear()
    await nameInput.fill('Renamed by Test')
    await page.getByRole('button', { name: /Update Item/i }).click()
    await expect(page.getByText('Renamed by Test')).toBeVisible()
  })

  test('editing value updates the displayed price', async ({ page }) => {
    await page.getByRole('button', { name: /Edit/i }).first().click()
    await expect(page.getByText(/^Edit:/)).toBeVisible()
    const valueInput = formFields(page).value
    await valueInput.clear()
    await valueInput.fill('777.77')
    await page.getByRole('button', { name: /Update Item/i }).click()
    await expect(page.getByText('$777.77')).toBeVisible()
  })

  test('cancel closes the edit modal without saving', async ({ page }) => {
    await page.getByRole('button', { name: /Edit/i }).first().click()
    await expect(page.getByText(/^Edit:/)).toBeVisible()
    const nameInput = formFields(page).name
    const originalName = await nameInput.inputValue()
    await nameInput.fill('Should Not Save')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Should Not Save')).not.toBeVisible()
    await expect(page.getByText(originalName)).toBeVisible()
  })

  test('modal closes after successful update', async ({ page }) => {
    await page.getByRole('button', { name: /Edit/i }).first().click()
    await page.getByRole('button', { name: /Update Item/i }).click()
    await expect(page.getByText(/^Edit:/)).not.toBeVisible()
  })
})

// ============================================================================
// DELETE ITEM
// ============================================================================

test.describe('Delete item', () => {
  test('confirming delete removes item from the list', async ({ page }) => {
    // Accept the confirm() dialog
    page.on('dialog', d => d.accept())
    const firstCard = page.locator('h3').first()
    const nameToDelete = await firstCard.textContent()

    await page.getByRole('button', { name: 'Delete' }).first().click()
    await page.waitForTimeout(300)

    await expect(page.getByText(nameToDelete!)).not.toBeVisible()
  })

  test('item count decreases by 1 after delete', async ({ page }) => {
    page.on('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Delete' }).first().click()
    await page.waitForTimeout(300)
    await expect(page.getByText('4 items')).toBeVisible()
  })

  test('dismissing confirm dialog keeps the item', async ({ page }) => {
    page.on('dialog', d => d.dismiss())
    const firstName = await page.locator('h3').first().textContent()
    await page.getByRole('button', { name: 'Delete' }).first().click()
    await expect(page.getByText(firstName!)).toBeVisible()
    await expect(page.locator('h3')).toHaveCount(5)
  })

  test('deleting all items shows empty state message', async ({ page }) => {
    page.on('dialog', d => d.accept())
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Delete' }).first().click()
      await page.waitForTimeout(300)
    }
    await expect(page.getByText('No items found')).toBeVisible()
  })
})

// ============================================================================
// STATS PANEL
// ============================================================================

test.describe('Stats panel', () => {
  test('shows "Server Stats" heading', async ({ page }) => {
    await expect(page.getByText('Server Stats')).toBeVisible()
  })

  test('"GET /api/stats" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /GET \/api\/stats/i })).toBeVisible()
  })

  test('"POST /api/reset" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /POST \/api\/reset/i })).toBeVisible()
  })

  test('clicking GET /api/stats shows Total Items stat', async ({ page, viewport }) => {
    // The stats panel is a fixed right sidebar — hidden by CSS overflow on
    // narrow viewports (Pixel 5 is 393 px wide, sidebar is 320 px).
    if (viewport && viewport.width < 600) test.skip()
    await page.getByRole('button', { name: /GET \/api\/stats/i }).click()
    await expect(page.getByText('Total Items')).toBeVisible()
  })

  test('stats show correct total after reset', async ({ page, viewport }) => {
    if (viewport && viewport.width < 600) test.skip()
    await page.getByRole('button', { name: /GET \/api\/stats/i }).click()
    await expect(page.getByText('Total Items')).toBeVisible()
    // The "5" immediately follows the "Total Items" label in the same stat box.
    // Use nth(0) because multiple stat boxes may show the same numeric value.
    const statBox = page.getByText('Total Items').locator('..').locator('..')
    await expect(statBox.locator('p').filter({ hasText: /^\d+$/ }).first()).toHaveText('5')
  })

  test('clicking POST /api/reset restores 5 items in the catalog', async ({ page }) => {
    // First delete an item
    page.on('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Delete' }).first().click()
    await page.waitForTimeout(300)
    await expect(page.locator('h3')).toHaveCount(4)

    // Now reset
    await page.getByRole('button', { name: /POST \/api\/reset/i }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('h3')).toHaveCount(5)
  })
})

// ============================================================================
// TAB NAVIGATION
// ============================================================================

test.describe('Tab navigation', () => {
  test('catalog tab shows item grid', async ({ page }) => {
    await page.getByRole('button', { name: 'catalog' }).click()
    await expect(page.getByText('Item Catalog')).toBeVisible()
  })

  test('concepts tab switches away from item catalog', async ({ page }) => {
    await page.getByRole('button', { name: 'concepts' }).click()
    await expect(page.getByText('Item Catalog')).not.toBeVisible()
  })

  test('switching back to catalog tab shows items', async ({ page }) => {
    await page.getByRole('button', { name: 'concepts' }).click()
    await page.getByRole('button', { name: 'catalog' }).click()
    await expect(page.getByText('Item Catalog')).toBeVisible()
    await expect(page.locator('h3')).toHaveCount(5)
  })
})

// ============================================================================
// FULL CRUD WORKFLOW
// ============================================================================

test.describe('Full CRUD workflow', () => {
  test('create → verify → edit → verify → delete → gone', async ({ page }) => {
    // 1. Create
    await fillAndSubmitCreateForm(page, {
      name: 'Workflow Item',
      description: 'Full test workflow',
      category: 'electronics',
      value: '199.99',
      quantity: '3',
      tags: 'workflow, test',
    })
    await expect(page.getByText('Workflow Item')).toBeVisible()
    await expect(page.getByText('$199.99')).toBeVisible()

    // 2. Edit
    await clickCardButton(page, 'Workflow Item', /Edit/i)
    await expect(page.getByText(/^Edit:/)).toBeVisible()

    const nameInput = formFields(page).name
    await nameInput.clear()
    await nameInput.fill('Workflow Item Updated')
    await page.getByRole('button', { name: /Update Item/i }).click()
    await expect(page.getByText('Workflow Item Updated')).toBeVisible()

    // 3. Delete
    page.on('dialog', d => d.accept())
    await clickCardButton(page, 'Workflow Item Updated', 'Delete')
    await page.waitForTimeout(300)
    await expect(page.getByText('Workflow Item Updated')).not.toBeVisible()
  })
})
