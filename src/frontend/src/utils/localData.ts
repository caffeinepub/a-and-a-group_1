// ─── Types ─────────────────────────────────────────────────────────────────

export interface OfficerPermissions {
  manageServices: boolean;
  enableDisableServices: boolean;
  uploadPortfolio: boolean;
  addReviews: boolean;
  respondToInquiries: boolean;
  manageSubmissions: boolean;
}

export interface SiteUser {
  userCode: string;
  name: string;
  registeredAt: string;
  isBlocked: boolean;
}

export interface Officer {
  userCode: string;
  name: string;
  promotedAt: string;
  permissions: OfficerPermissions;
}

// ─── Keys ──────────────────────────────────────────────────────────────────

const KEYS = {
  userName: "aag_user_name",
  userCode: "aag_user_code",
  users: "aag_users",
  officers: "aag_officers",
  blockedCodes: "aag_blocked_codes",
  pinVerified: "aag_admin_pin_verified",
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Current User ──────────────────────────────────────────────────────────

export function getCurrentUser(): { name: string; code: string } | null {
  const name = localStorage.getItem(KEYS.userName);
  const code = localStorage.getItem(KEYS.userCode);
  if (!name || !code) return null;
  return { name, code };
}

export function setCurrentUser(name: string, code: string): void {
  localStorage.setItem(KEYS.userName, name);
  localStorage.setItem(KEYS.userCode, code);
}

export function generateUserCode(): string {
  return String(Math.floor(1_000_000 + Math.random() * 9_000_000));
}

// ─── User Management ───────────────────────────────────────────────────────

export function getUsers(): SiteUser[] {
  return readJSON<SiteUser[]>(KEYS.users, []);
}

export function addUser(user: SiteUser): void {
  const users = getUsers();
  const exists = users.some((u) => u.userCode === user.userCode);
  if (!exists) {
    writeJSON(KEYS.users, [...users, user]);
  }
}

export function updateUser(userCode: string, updates: Partial<SiteUser>): void {
  const users = getUsers().map((u) =>
    u.userCode === userCode ? { ...u, ...updates } : u,
  );
  writeJSON(KEYS.users, users);
}

export function getUser(userCode: string): SiteUser | undefined {
  return getUsers().find((u) => u.userCode === userCode);
}

// ─── Officer Management ────────────────────────────────────────────────────

export function getOfficers(): Officer[] {
  return readJSON<Officer[]>(KEYS.officers, []);
}

export function addOfficer(officer: Officer): void {
  const officers = getOfficers().filter((o) => o.userCode !== officer.userCode);
  writeJSON(KEYS.officers, [...officers, officer]);
}

export function updateOfficer(
  userCode: string,
  permissions: OfficerPermissions,
): void {
  const officers = getOfficers().map((o) =>
    o.userCode === userCode ? { ...o, permissions } : o,
  );
  writeJSON(KEYS.officers, officers);
}

export function removeOfficer(userCode: string): void {
  const officers = getOfficers().filter((o) => o.userCode !== userCode);
  writeJSON(KEYS.officers, officers);
}

export function isOfficer(userCode: string): boolean {
  return getOfficers().some((o) => o.userCode === userCode);
}

// ─── Block Management ──────────────────────────────────────────────────────

export function getBlockedCodes(): string[] {
  return readJSON<string[]>(KEYS.blockedCodes, []);
}

export function blockUser(userCode: string): void {
  const codes = getBlockedCodes();
  if (!codes.includes(userCode)) {
    writeJSON(KEYS.blockedCodes, [...codes, userCode]);
  }
  updateUser(userCode, { isBlocked: true });
}

export function unblockUser(userCode: string): void {
  const codes = getBlockedCodes().filter((c) => c !== userCode);
  writeJSON(KEYS.blockedCodes, codes);
  updateUser(userCode, { isBlocked: false });
}

export function isBlocked(userCode: string): boolean {
  return getBlockedCodes().includes(userCode);
}

// ─── Session PIN ───────────────────────────────────────────────────────────

export function isPinVerified(): boolean {
  return sessionStorage.getItem(KEYS.pinVerified) === "true";
}

export function setPinVerified(value: boolean): void {
  if (value) {
    sessionStorage.setItem(KEYS.pinVerified, "true");
  } else {
    sessionStorage.removeItem(KEYS.pinVerified);
  }
}
