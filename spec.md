# A AND A GROUP

## Current State
The website has a complete Motoko backend with APIs for orders, problem reports, payment settings, and user profiles. However, the frontend saves most data to localStorage instead of the backend. This means each phone/browser has its own isolated data — users, orders, problem reports, and payment QR code are all local-only.

Specific localStorage-only flows:
- User registration (name + user code) saved to localStorage only
- Problem reports saved to localStorage; backend call is made but result is ignored for display
- Payment settings (especially QR code as base64 data URL) saved to localStorage only
- Admin dashboard user count reads from localStorage `aag_users` array
- Admin reported issues tab merges localStorage + backend but primary source is localStorage

The backend already supports:
- `submitProblemReport` / `listProblemReports` — full CRUD
- `getPaymentSettings` / `updatePaymentSettings` — stores upiId, accountHolderName, accountNumber, ifscCode, qrCodeBlobId
- `submitOrder` / `listAllOrders` / `getOrderByOrderId` — full order management
- `saveCallerUserProfile` / `getCallerUserProfile` — user profile storage

## Requested Changes (Diff)

### Add
- QR code blob upload in AdminPaymentSettingsTab: upload QR image to blob storage, store blob ID in backend `updatePaymentSettings`, retrieve it via `getPaymentSettings` on the payment page
- `useGetPaymentSettings` hook usage on ContactPage so QR is fetched from backend

### Modify
- **AdminReportedIssuesTab**: Make backend the primary source of truth. Remove localStorage-first logic. Load reports from `useListProblemReports()`, update status via `useUpdateProblemReportStatus()`, delete via `useDeleteProblemReport()`. Keep localStorage only as a local read cache for unread badge.
- **FloatingWidgets (ticket submit)**: Remove `addReport()` localStorage call. Only call `submitReport` backend API. Show ticket reference from the returned backend ID.
- **AdminPaymentSettingsTab**: Change QR upload to use blob storage. On save, call `updatePaymentSettings` with the real `qrCodeBlobId`. Remove localStorage `setPaymentSettings` for QR. Keep localStorage only for non-QR text fields as optimistic cache.
- **ContactPage payment section**: Load QR from backend `getPaymentSettings()` and construct blob URL using blob storage URL pattern, not from localStorage.
- **Admin dashboard user count**: The backend does not have a `listAllUsers` endpoint. Keep user count from localStorage but show a note. Focus fixes on problem reports and payment QR which are most impactful.
- **AdminReportedIssuesTab unread badge**: Count unread from backend reports not yet seen in this session (use sessionStorage to track which IDs have been seen).

### Remove
- localStorage as primary store for problem reports in AdminReportedIssuesTab
- localStorage QR image URL as source of truth for payment page

## Implementation Plan
1. Fix `AdminReportedIssuesTab` to use backend as primary source (useListProblemReports, useUpdateProblemReportStatus, useDeleteProblemReport) — remove getReports/updateReportStatus/deleteReport/markReportRead localStorage calls
2. Fix `FloatingWidgets` ticket submit to remove addReport localStorage call, use backend ID as ticket reference
3. Fix `AdminPaymentSettingsTab` QR upload: use useBlobStorage upload hook to get a blobId, then save it to backend via updatePaymentSettings
4. Fix `ContactPage` to load payment settings including QR from backend via useGetPaymentSettings hook
5. Fix unread report badge to track seen IDs in sessionStorage based on backend report IDs
