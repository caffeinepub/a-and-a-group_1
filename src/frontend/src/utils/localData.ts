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

// ─── Problem Report ─────────────────────────────────────────────────────────

export interface ProblemReport {
  id: string;
  name: string;
  email: string;
  orderId?: string;
  description: string;
  status: "pending" | "resolved";
  createdAt: string; // ISO
  isRead?: boolean;
}

// ─── Payment Settings ────────────────────────────────────────────────────────

export interface LocalPaymentSettings {
  upiId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  qrImageUrl: string; // blob URL or data URL
}

const DEFAULT_PAYMENT_SETTINGS: LocalPaymentSettings = {
  upiId: "aloksi@ptyes",
  accountHolderName: "Niraj Singh",
  accountNumber: "7380869635",
  ifscCode: "AIRP0000001",
  qrImageUrl: "",
};

// ─── Keys ──────────────────────────────────────────────────────────────────

const KEYS = {
  userName: "aag_user_name",
  userCode: "aag_user_code",
  users: "aag_users",
  officers: "aag_officers",
  blockedCodes: "aag_blocked_codes",
  pinVerified: "aag_admin_pin_verified",
  orders: "aag_orders",
  problemReports: "aag_problem_reports",
  paymentSettings: "aag_payment_settings",
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

// ─── Order Management ──────────────────────────────────────────────────────

export type OrderStatus = "received" | "inProgress" | "completed";
export type PaymentStatus = "pending" | "paid" | "completed";

export interface Order {
  id: string;
  orderId: string; // "AAG-XXXXXXX"
  name: string;
  email: string;
  whatsappNumber: string;
  service: string;
  projectDetails: string;
  budget: string;
  deadline: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  createdAt: string; // ISO date string
  screenshotBlobId?: string;
}

export function generateOrderId(): string {
  const digits = Math.floor(1_000_000 + Math.random() * 9_000_000);
  return `AAG-${digits}`;
}

export function getOrders(): Order[] {
  return readJSON<Order[]>(KEYS.orders, []);
}

export function addOrder(order: Order): void {
  const orders = getOrders();
  writeJSON(KEYS.orders, [...orders, order]);
}

export function updateOrderStatus(id: string, status: OrderStatus): void {
  const orders = getOrders().map((o) => (o.id === id ? { ...o, status } : o));
  writeJSON(KEYS.orders, orders);
}

export function deleteOrder(id: string): void {
  const orders = getOrders().filter((o) => o.id !== id);
  writeJSON(KEYS.orders, orders);
}

export function updateOrderPaymentStatus(
  id: string,
  status: PaymentStatus,
): void {
  const orders = getOrders().map((o) =>
    o.id === id ? { ...o, paymentStatus: status } : o,
  );
  writeJSON(KEYS.orders, orders);
}

export function updateOrderScreenshot(
  id: string,
  screenshotBlobId: string,
): void {
  const orders = getOrders().map((o) =>
    o.id === id ? { ...o, screenshotBlobId } : o,
  );
  writeJSON(KEYS.orders, orders);
}

// ─── Problem Reports ────────────────────────────────────────────────────────

export function getReports(): ProblemReport[] {
  return readJSON<ProblemReport[]>(KEYS.problemReports, []);
}

export function addReport(report: ProblemReport): void {
  const reports = getReports();
  writeJSON(KEYS.problemReports, [...reports, report]);
}

export function updateReportStatus(
  id: string,
  status: "pending" | "resolved",
): void {
  const reports = getReports().map((r) => (r.id === id ? { ...r, status } : r));
  writeJSON(KEYS.problemReports, reports);
}

export function deleteReport(id: string): void {
  const reports = getReports().filter((r) => r.id !== id);
  writeJSON(KEYS.problemReports, reports);
}

export function markReportRead(id: string): void {
  const reports = getReports().map((r) =>
    r.id === id ? { ...r, isRead: true } : r,
  );
  writeJSON(KEYS.problemReports, reports);
}

export function getUnreadReportCount(): number {
  return getReports().filter((r) => !r.isRead && r.status === "pending").length;
}

// ─── Payment Settings ────────────────────────────────────────────────────────

export function getPaymentSettings(): LocalPaymentSettings {
  return readJSON<LocalPaymentSettings>(
    KEYS.paymentSettings,
    DEFAULT_PAYMENT_SETTINGS,
  );
}

export function setPaymentSettings(settings: LocalPaymentSettings): void {
  writeJSON(KEYS.paymentSettings, settings);
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

// ─── Upload Error Log ──────────────────────────────────────────────────────

export interface UploadError {
  id: string;
  fileName: string;
  reason: string;
  timestamp: string; // ISO
}

// ─── Media Items ─────────────────────────────────────────────────────────────

export interface MediaItem {
  id: string;
  name: string;
  blobId: string;
  mediaType: string; // 'image/jpeg', 'image/png', 'video/mp4', 'video/embed'
  size: number; // bytes (0 for embeds)
  uploadedAt: string; // ISO
}

// ─── Extended Keys ─────────────────────────────────────────────────────────

const EXTENDED_KEYS = {
  uploadErrors: "aag_upload_errors",
  mediaItems: "aag_media_items",
} as const;

// ─── Upload Error CRUD ─────────────────────────────────────────────────────

export function getUploadErrors(): UploadError[] {
  return readJSON<UploadError[]>(EXTENDED_KEYS.uploadErrors, []);
}

export function addUploadError(error: UploadError): void {
  const errors = getUploadErrors();
  writeJSON(EXTENDED_KEYS.uploadErrors, [error, ...errors].slice(0, 100));
}

export function clearUploadErrors(): void {
  writeJSON(EXTENDED_KEYS.uploadErrors, []);
}

// ─── Media Items CRUD ─────────────────────────────────────────────────────

export function getMediaItems(): MediaItem[] {
  return readJSON<MediaItem[]>(EXTENDED_KEYS.mediaItems, []);
}

export function addMediaItem(item: MediaItem): void {
  const items = getMediaItems();
  writeJSON(EXTENDED_KEYS.mediaItems, [...items, item]);
}

export function deleteMediaItem(id: string): void {
  const items = getMediaItems().filter((m) => m.id !== id);
  writeJSON(EXTENDED_KEYS.mediaItems, items);
}

export function replaceMediaItemBlobId(id: string, newBlobId: string): void {
  const items = getMediaItems().map((m) =>
    m.id === id ? { ...m, blobId: newBlobId } : m,
  );
  writeJSON(EXTENDED_KEYS.mediaItems, items);
}

// ─── AI Chat Logs ─────────────────────────────────────────────────────────

export interface AIChatMessage {
  role: "user" | "bot";
  text: string;
  timestamp: string; // ISO
}

export interface AIChatLog {
  id: string;
  userCode: string;
  userName: string;
  sessionStart: string; // ISO
  messages: AIChatMessage[];
}

const CHAT_LOGS_KEY = "aag_ai_chat_logs";

export function getChatLogs(): AIChatLog[] {
  return readJSON<AIChatLog[]>(CHAT_LOGS_KEY, []);
}

export function saveChatLog(log: AIChatLog): void {
  const logs = getChatLogs();
  const idx = logs.findIndex((l) => l.id === log.id);
  if (idx >= 0) {
    logs[idx] = log;
  } else {
    logs.unshift(log);
  }
  // Keep latest 200 sessions
  writeJSON(CHAT_LOGS_KEY, logs.slice(0, 200));
}

export function deleteChatLog(id: string): void {
  const logs = getChatLogs().filter((l) => l.id !== id);
  writeJSON(CHAT_LOGS_KEY, logs);
}
