# A AND A GROUP

## Current State
The app has a full Motoko backend (central server) with: orders, problemReports, paymentSettings, contactSubmissions (used to store user registrations), portfolio, reviews, services. The frontend has React with localStorage-heavy patterns that prevent cross-device sync.

**Root cause of all reported bugs:**  
Most data reads/writes still fall back to localStorage. The Motoko backend is fully functional but not consistently called. Specific broken flows:

1. **UserIdentityModal**: Registers user to localStorage immediately, then TRIES to save to backend — but the actor polling loop re-reads the same `actor` ref (closure problem) and never actually gets an updated actor. So backend save never happens.
2. **AdminPage user search**: Calls `parseBackendUsers(submissions)` but also mixes in `getUsers()` from localStorage. Cross-device searches fail because localStorage only has data from the current device.
3. **AdminPaymentSettingsTab**: Saves to localStorage FIRST, then tries backend. If backend fails (auth issue or not-yet-initialized), it silently ignores and shows "saved locally". Clients on other phones never see the QR code.
4. **ContactPage PaymentSection**: Reads QR from `backendSettings?.qrCodeBlobId || localSettings.qrCodeBlobId`. If localStorage has a stale/different value it overrides the backend setting.
5. **FloatingWidgets AI Chat**: Ticket form does not auto-fill current user name/email/code. AI is basic keyword matching with no context about the specific user.

## Requested Changes (Diff)

### Add
- AI chat ticket form auto-fills: name, email, user code from `getCurrentUser()` (localStorage is fine here since it IS the current device's identity)
- Admin user management: properly merge backend-parsed users with localStorage users, deduplicate by userCode, prioritize backend data
- Admin "Total Users" count comes from backend submissions count (cross-device)
- Officer management: when adding an officer by code, if not found in localStorage, show a form to enter their name and create the officer entry
- AI assistant: smarter context-aware responses including user name display, more Hindi keywords coverage

### Modify
- **UserIdentityModal**: Fix the actor polling — use `waitForActorGlobal` pattern (poll `window.__aag_actor` or use a dedicated exported promise) rather than re-reading a stale closure ref
- **AdminPaymentSettingsTab `handleSave`**: Remove localStorage save. Only save to backend. Show proper error if backend fails instead of silent fallback
- **ContactPage `PaymentSection`**: Remove localStorage fallback entirely. Read only from `backendSettings`. Show loading state until backend data arrives
- **AdminPage `parseBackendUsers`**: Make this the primary source. Merge with localStorage but give backend precedence
- **FloatingWidgets**: Auto-fill ticket form with current user's name and email from localStorage (since that IS their identity on this device); display user name in greeting

### Remove
- `localStorage.setItem("aag_payment_settings", ...)` write in AdminPaymentSettingsTab
- `const localSettings = localStorage.getItem("aag_payment_settings")` read in ContactPage PaymentSection
- `localParsed` fallback chain in AdminPaymentSettingsTab

## Implementation Plan
1. Fix `UserIdentityModal.tsx` — export a `waitForActor` utility that uses the `useActor` hook's actor ref shared via a module-level variable, OR simply use `waitForActor` from useQueries.ts pattern but pass it to the component. The simplest fix: import `useSubmitContact` from useQueries (which already has `waitForActor` built in) and call it instead of calling `currentActor.submitContact` directly.
2. Fix `AdminPaymentSettingsTab.tsx` — remove localStorage write/read, throw error clearly if backend save fails
3. Fix `ContactPage.tsx` — remove localStorage fallback for payment settings, show skeleton until `backendSettings` loads  
4. Fix `AdminPage.tsx` — improve `parseBackendUsers` to properly merge, fix total users count display
5. Fix `FloatingWidgets.tsx` — auto-fill ticket form with user info, display user name in greeting, add more Hindi keyword coverage
