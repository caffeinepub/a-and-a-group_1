# A AND A GROUP

## Current State
- Two separate floating icons: AI chat (bottom-left, Bot icon) and Support widget (bottom-right, HelpCircle icon)
- AI chat uses basic keyword matching (English only), no typing animation, no ticket generation
- Support widget opens a panel with WhatsApp, Email, Payment Issue, Report a Problem options
- Report a Problem opens a Dialog form; saved to localStorage + backend
- No AI conversation logging, no admin AI logs tab
- User orders stored in localStorage; no per-user data scoping in the AI
- Admin identified by user code `1649963` stored in localStorage

## Requested Changes (Diff)

### Add
- Merge both floating icons into a single advanced AI chat system (bottom-right)
- A small "?" support quick-access button sitting just above the AI chat button (stacked vertically, no overlap)
- Typing animation (~1 second delay) before bot response appears, with animated dots
- Multilingual AI: detect language of user input (Hindi/English/other), respond in same language
- Step-by-step guidance flows: placing orders, payment, uploading screenshots, tracking orders
- Per-user data scoping: AI can look up orders by the current user's code; shows only their orders
- Admin (user code 1649963) sees all orders when querying through AI
- Auto ticket generation: if AI cannot resolve, show "Create Ticket" button in chat; ticket form inside chat panel (Name, Email, Order ID optional, Issue Type, Description); submits to backend via `submitProblemReport`; saves to localStorage
- AI conversation logs stored in localStorage (per session, keyed by user code + timestamp)
- Admin AI Logs tab in Admin Portal showing all conversation logs with user code, messages, timestamp
- Central shared localStorage namespace (already in place via localStorage keys)

### Modify
- FloatingWidgets.tsx: remove separate left/right positioning, merge into single bottom-right cluster
- `getBotResponse` upgraded to multilingual, step-by-step, order-aware response engine
- Support options (WhatsApp, Email, Payment Issue) moved inside the AI chat panel as quick-action buttons when user asks for "support" or "help"
- Greeting message updated to be bilingual-aware

### Remove
- Standalone left-side AI chat button
- Standalone right-side support toggle button (replaced by stacked "?" above AI button)

## Implementation Plan
1. Add `AIChatLog` interface and CRUD functions to `localData.ts`
2. Rewrite `FloatingWidgets.tsx`:
   - Single bottom-right cluster: stacked "?" button above main AI chat button
   - Merged AI panel with support quick-actions tab and full chat
   - `getBotResponse` with language detection (Hindi keywords), order lookup by user code, step-by-step flows
   - Typing animation (1s delay, animated dots)
   - Auto ticket creation flow inside chat when AI cannot help
   - Log all conversations to localStorage
3. Add `AdminAILogsTab.tsx` in admin pages
4. Wire Admin AI Logs tab into `AdminPage.tsx` sidebar
