# A AND A GROUP — Admin Portal & Team Management System

## Current State

The app has:
- A public website (Home, Services, Portfolio, Reviews, Contact pages)
- An existing `/admin` route protected by Internet Identity login
- Admin tabs: Services, Portfolio, Reviews, Submissions
- Backend with services, portfolio, reviews, contact submissions, and blob storage
- Authorization via `AccessControl` with `#admin` / `#user` / `#guest` roles
- No user identification system (no name/code for visitors)
- No officer/sub-admin system
- No PIN-based security layer
- No spam/block list
- No officer permission management

## Requested Changes (Diff)

### Add

**Backend:**
- `SiteUser` type: `{ userCode: Text; name: Text; createdAt: Int; isBlocked: Bool }`
- `Officer` type: `{ userCode: Text; name: Text; permissions: OfficerPermissions; promotedAt: Int }`
- `OfficerPermissions` type: `{ manageServices: Bool; enableDisableServices: Bool; uploadPortfolio: Bool; addReviews: Bool; respondToInquiries: Bool; manageSubmissions: Bool }`
- `registerUser(name: Text): async Text` — generates a unique 7-digit code, stores user, returns code
- `getUser(userCode: Text): async ?SiteUser` — lookup user by code
- `listUsers(): async [SiteUser]` — admin only
- `promoteToOfficer(userCode: Text, permissions: OfficerPermissions): async ()` — master admin only
- `demoteOfficer(userCode: Text): async ()` — master admin only
- `updateOfficerPermissions(userCode: Text, permissions: OfficerPermissions): async ()` — master admin only
- `listOfficers(): async [Officer]` — admin only
- `blockUser(userCode: Text): async ()` — admin only, blocks user from submitting contact forms
- `unblockUser(userCode: Text): async ()` — admin only
- `isUserBlocked(userCode: Text): async Bool` — public query
- Update `submitContact` to check if caller's user code is blocked
- Add `userCode: ?Text` field to `ContactSubmission` to track which user submitted

**Frontend (new):**
- `UserIdentityModal` — shown on first visit, asks for name, shows generated 7-digit user code, stores in localStorage
- Admin Portal PIN lock screen — shown before admin dashboard, requires PIN `1207`
- `AdminDashboard` section with analytics cards (total users, officers, services, submissions)
- `AdminUsersTab` — lists all registered users, shows user code, block/unblock action
- `AdminOfficersTab` — promote user by entering 7-digit code, set permissions per officer, demote officer
- `AdminSpamTab` — blocked users list, unblock action
- Admin sidebar navigation (Dashboard, User Mgmt, Officer Mgmt, Services, Portfolio, Reviews, Spam/Block, Settings)
- Settings tab showing master admin info

### Modify

- `AdminPage.tsx` — replace tab-based layout with full sidebar dashboard; add PIN lock layer before showing dashboard content; add new sections
- `submitContact` backend — check `isUserBlocked` before allowing submission
- `ContactPage.tsx` — read `userCode` from localStorage and pass it with form submission
- `HomePage.tsx` / root layout — trigger `UserIdentityModal` on first visit if no name/code stored in localStorage

### Remove

- Nothing removed; existing admin tabs (Services, Portfolio, Reviews, Submissions) are preserved inside the new sidebar layout

## Implementation Plan

1. **Backend:** Add `SiteUser`, `Officer`, `OfficerPermissions` types; implement `registerUser`, `getUser`, `listUsers`, `promoteToOfficer`, `demoteOfficer`, `updateOfficerPermissions`, `listOfficers`, `blockUser`, `unblockUser`, `isUserBlocked`; update `submitContact` to accept optional `userCode` and block check.

2. **Frontend — User Identity:** Create `UserIdentityModal` component; on first visit (no localStorage `aag_user_code`), show modal to capture name, call `registerUser`, store returned code + name in localStorage.

3. **Frontend — Admin PIN Lock:** Add PIN entry screen to `AdminPage` before showing the dashboard. PIN is `1207` stored client-side. After correct PIN, store session flag.

4. **Frontend — Admin Sidebar Layout:** Replace flat tabs with a two-column layout: fixed left sidebar with navigation links, right content area. Sections: Dashboard, User Management, Officer Management, Services Management, Portfolio Management, Reviews Management, Spam/Block List, Settings.

5. **Frontend — Dashboard Section:** Analytics cards showing stats (total users, total officers, active services, unread submissions). Recent activity list.

6. **Frontend — User Management Tab:** Table of all registered users with columns: name, user code, registered date, status (active/blocked). Block/unblock toggle per user.

7. **Frontend — Officer Management Tab:** List of current officers with their permissions. Form to promote a user by entering their 7-digit code and selecting permissions. Demote button per officer. Edit permissions for existing officers.

8. **Frontend — Spam/Block List Tab:** List of blocked users. Unblock action.

9. **Frontend — Settings Tab:** Display master admin email (`workfora.agroup@zohomail.in`), admin PIN info, platform info.

10. **Validation:** Run typecheck, lint, build.
