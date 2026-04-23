# 06-stats-panel.md — Server Stats Panel and Stateful Demonstration

Overview
- StatsPanel demonstrates a stateful endpoint by querying `/api/stats` and displaying server-derived aggregates.
- It also supports a reset action via `/api/reset` to illustrate server state mutation and re-seeding.

State and behavior
- Internal state:
  - stats: StatsResponse | null — current stats data
  - loading: boolean — loading indicator when fetching stats
- Actions:
  - GET /api/stats to populate the stats panel
  - POST /api/reset to reset and reseed demo data; followed by a full page reload to refresh cached data

UI composition
- Stats are displayed in colored, labeled boxes (Total Items, Total Quantity, Total Value, Requests Handled).
- A By Category section enumerates counts per category.
- A helper component, StatBox, renders individual stat blocks with color accents.

Data flow notes
- The frontend fetches server-generated data; the server computes stats from its in-memory store.
- The client does not synthesize these numbers; it only displays what the server returns.

ASCII diagram: Data path for stats
```
User clicks 'GET /api/stats' → frontend (StatsPanel) -> utilsApi.stats()
 -> API response (StatsResponse) -> UI state (setStats) -> re-render
User clicks 'POST /api/reset' -> server resets in-memory store -> page reload
```
