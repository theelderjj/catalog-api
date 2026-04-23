# 07-request-log-panel.md — Live API Request Log Panel

Overview
- RequestLogPanel renders a live feed of API calls as recorded by the Axios interceptors in `frontend/02-api-client.md`.
- It showcases how we capture method, URL, status, duration, and safety semantics for learning purposes.

State and interaction
- State:
  - logs: RequestLog[] — ordered from newest to oldest (most recent first)
  - expanded: string | null — ID of the log row currently expanded for details
- Interactions:
  - Click a log row to toggle details
  - Clear button empties the log

Data flow
- Each API call emits a RequestLog via the Subscribe/Emit mechanism in `frontend/02-api-client.md`.
- RequestLogPanel subscribes to logs in `useEffect` and updates its local `logs` state.
- Expanded details render JSON snippets for Request Headers, Request Body, and Response Body.

ASCII diagram: Log emission and rendering
```
API client -> emit log -> RequestLogPanel subscribes and updates UI
        ↓
   Request Log entries render (with expandable details)
```
