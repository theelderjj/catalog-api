# 04-item-form.md — Controlled Form for Create/Update Item

Overview
- ItemForm.tsx renders a controlled form used by CatalogPage for both creating and editing items.
- This document details how form fields map to payloads, how validation and parsing are performed, and how submit flows to the parent component.

Props and lifecycle
- Props:
  - initial?: Item — optional initial item for edit mode
  - onSubmit: (data: CreateItemPayload | UpdateItemPayload) => Promise<void>
  - onCancel: () => void
- The component renders a form with fields for: name, description, category, value, quantity, and tags.
- It computes `isEdit` as a boolean based on whether `initial` is provided.
- On submit, the form emits a payload to `onSubmit` and shows a loading state until completion.

Form state and mapping
- Local React state stores each field value as strings, with numeric inputs parsed on submit.
- Submit payload construction:
  - name: string
  - description: string
  - category: Category
  - value: number (parsed from string)
  - quantity: number (parsed from string)
  - tags: string[] (split on comma, trim, filter empties)
- The UI demonstrates idempotency vs non-idempotency notes in a small informational block.

Data flow notes
- When used for editing, initial values populate the form fields.
- On submit, the parent may perform a POST (create) or PUT (update) depending on mode, and then CatalogPage reloads items.

ASCII diagram: Form submission path
```
User fills form → clicks Submit
        |
        v
ItemForm builds payload → calls onSubmit(payload)
        |
        v
CatalogPage handles result and refreshes list
```
