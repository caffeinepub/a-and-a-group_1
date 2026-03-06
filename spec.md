# A AND A GROUP

## Current State
The Motoko backend already has all required data functions:
- `submitOrder` / `getOrderByOrderId` / `getOrdersByEmail` / `listAllOrders` / `updateOrderStatus` / `updateOrderPaymentStatus` / `updateOrderScreenshot`
- `submitProblemReport` / `listProblemReports` / `updateProblemReportStatus` / `deleteProblemReport`
- `getPaymentSettings` / `updatePaymentSettings`
- `submitContact` (used for user registration tracking)

The frontend saves data to **localStorage first** and calls the backend as a fire-and-forget. When the backend call fails silently, data is only local. Different phones/browsers each have their own localStorage, so data is never shared.

## Requested Changes (Diff)

### Add
- Await-first approach: frontend **awaits** backend calls for orders, problem reports, and payment settings before showing success
- Show loading state while backend is being called
- Show error toast if backend call fails so user knows to retry

### Modify
- `ContactPage.tsx`: `handleSubmit` — await `submitOrderBackend` first; only mark submitted if backend succeeds. Remove `addOrder` (localStorage) as primary path; keep it only as an offline emergency fallback.
- `FloatingWidgets.tsx` `handleTicketSubmit`: await `submitReport` backend call; show error if it fails; remove the localStorage fallback path for tickets.
- `AdminPaymentSettingsTab.tsx` (or wherever payment settings save happens): ensure it calls `updatePaymentSettings` and awaits it; remove the localStorage `setPaymentSettings` as primary.
- `ContactPage.tsx` `PaymentSection`: always fetch from `useGetPaymentSettings` (backend); remove local payment settings fallback from `getLocalPaymentSettings` to avoid confusion.
- `TrackOrderPage.tsx`: remove localStorage fallback for order search — if backend returns null/empty, show "not found". This ensures clients only see real centralized orders.
- `AdminOrdersTab.tsx`: already reads from `useListAllOrders` (backend) — no change needed.
- `AdminReportedIssuesTab.tsx`: confirm it reads from `useListProblemReports` (backend) — fix if still using localStorage.
- `AdminPage.tsx` `DashboardSection`: "Total Registered Users" count — use `submitContact` registrations from backend instead of localStorage `getUsers()`.

### Remove
- `addOrder` localStorage call as primary submission path (keep only as emergency fallback)
- `addReport` localStorage call in ticket submission (remove entirely)
- `getLocalPaymentSettings` fallback in PaymentSection (use backend-only)

## Implementation Plan
1. Fix `ContactPage.tsx` order submission: await backend `submitOrder`, show loading, show error if it fails. Only mark submitted=true after backend success.
2. Fix `FloatingWidgets.tsx` ticket submission: await backend `submitProblemReport`, show error toast if fails, no localStorage fallback.
3. Fix `AdminReportedIssuesTab.tsx`: confirm it uses `useListProblemReports` hook (backend), not localStorage `getReports()`.
4. Fix `PaymentSection` in `ContactPage.tsx`: remove local payment settings merge, use backend-only via `useGetPaymentSettings`.
5. Fix `TrackOrderPage.tsx`: remove localStorage fallback for order search — backend is the only source of truth.
6. Fix `AdminPaymentSettingsTab.tsx`: ensure save calls backend `updatePaymentSettings` and awaits.
