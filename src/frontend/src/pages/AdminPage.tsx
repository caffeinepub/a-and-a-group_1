import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  FolderOpen,
  Image,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ContactSubmission } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useListAllOrders,
  useListPortfolio,
  useListProblemReports,
  useListReviews,
  useListServices,
  useListSubmissions,
} from "../hooks/useQueries";
import {
  type Officer,
  type OfficerPermissions,
  type SiteUser,
  addOfficer,
  blockUser,
  getCurrentUser,
  getOfficers,
  getUser,
  getUsers,
  isOfficer,
  isPinVerified,
  removeOfficer,
  setPinVerified,
  unblockUser,
  updateOfficer,
} from "../utils/localData";
import AdminAIChatLogsTab from "./admin/AdminAIChatLogsTab";
import AdminMediaManagerTab from "./admin/AdminMediaManagerTab";
import AdminOrdersTab from "./admin/AdminOrdersTab";
import AdminPaymentSettingsTab from "./admin/AdminPaymentSettingsTab";
import AdminPortfolioTab from "./admin/AdminPortfolioTab";
import AdminReportedIssuesTab from "./admin/AdminReportedIssuesTab";
import AdminReviewsTab from "./admin/AdminReviewsTab";
import AdminServicesTab from "./admin/AdminServicesTab";
import AdminSubmissionsTab from "./admin/AdminSubmissionsTab";

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Parse user registrations stored in backend contact submissions.
 * When a user registers, a contact submission is saved with:
 *   email = "user_reg_XXXXXXX@aag.internal"
 *   projectDetails = "USER_REGISTRATION|code:1234567|name:John|registeredAt:..."
 */
function parseBackendUsers(submissions: ContactSubmission[]): SiteUser[] {
  return submissions
    .filter((s) => /^user_reg_.*@aag\.internal$/.test(s.email))
    .map((s) => {
      const parts: Record<string, string> = {};
      for (const part of s.projectDetails.split("|")) {
        const idx = part.indexOf(":");
        if (idx !== -1) {
          const key = part.slice(0, idx);
          const val = part.slice(idx + 1);
          parts[key] = val;
        }
      }
      return {
        userCode: parts.code || "",
        name: parts.name || s.name,
        registeredAt:
          parts.registeredAt ||
          new Date(Number(s.createdAt) / 1_000_000).toISOString(),
        isBlocked: false,
      } as SiteUser;
    })
    .filter((u) => u.userCode.length === 7);
}

// ─── Types ─────────────────────────────────────────────────────────────────

type Section =
  | "dashboard"
  | "users"
  | "officers"
  | "services"
  | "portfolio"
  | "media_manager"
  | "reviews"
  | "submissions"
  | "orders"
  | "spam"
  | "settings"
  | "reported_issues"
  | "payment_settings"
  | "ai_logs";

const ADMIN_PIN = "1207";
const MASTER_ADMIN_CODE = "1649963";

const DEFAULT_PERMISSIONS: OfficerPermissions = {
  manageServices: false,
  enableDisableServices: false,
  uploadPortfolio: false,
  addReviews: false,
  respondToInquiries: false,
  manageSubmissions: false,
};

const PERMISSION_LABELS: Record<keyof OfficerPermissions, string> = {
  manageServices: "Manage Services",
  enableDisableServices: "Enable / Disable Services",
  uploadPortfolio: "Upload Portfolio Work",
  addReviews: "Add Client Reviews",
  respondToInquiries: "Respond to Customer Inquiries",
  manageSubmissions: "Manage Contact Form Submissions",
};

// ─── PIN Screen ────────────────────────────────────────────────────────────

function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError(false);

    if (value && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }

    // Auto-check when all 4 entered
    if (value && index === 3) {
      const entered = [...next.slice(0, 3), value].join("");
      if (entered === ADMIN_PIN) {
        setPinVerified(true);
        // Auto-set admin identity so access guard passes regardless of registered user code
        localStorage.setItem("aag_user_name", "Master Admin");
        localStorage.setItem("aag_user_code", MASTER_ADMIN_CODE);
        onSuccess();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setPin(["", "", "", ""]);
          setShake(false);
          inputRefs[0]?.current?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = pin.join("");
    if (entered.length < 4) return;
    if (entered === ADMIN_PIN) {
      setPinVerified(true);
      // Auto-set admin identity so access guard passes regardless of registered user code
      localStorage.setItem("aag_user_name", "Master Admin");
      localStorage.setItem("aag_user_code", MASTER_ADMIN_CODE);
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => {
        setPin(["", "", "", ""]);
        setShake(false);
        inputRefs[0]?.current?.focus();
      }, 600);
    }
  };

  return (
    <div
      data-ocid="admin.pin.modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse 120% 100% at 50% 0%, oklch(0.12 0.03 265 / 0.98) 0%, oklch(0.06 0.01 265) 100%)",
      }}
    >
      {/* Ambient bg effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 210) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.62 0.22 295) 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card text-center">
          {/* Brand */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4 animate-pulse-glow">
              <ShieldAlert className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display font-bold text-xl text-foreground mb-0.5">
              A AND A GROUP
            </h1>
            <p className="text-xs text-primary font-body font-medium tracking-widest uppercase">
              Admin Portal
            </p>
          </div>

          <Separator className="mb-8" />

          <h2 className="font-display font-semibold text-base text-foreground mb-2">
            Enter Admin PIN
          </h2>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Enter your 4-digit PIN to access the portal
          </p>

          <form onSubmit={handleSubmit}>
            <motion.div
              animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="flex justify-center gap-3 mb-4"
            >
              {([0, 1, 2, 3] as const).map((i) => (
                <input
                  key={`pin-${i}`}
                  ref={inputRefs[i]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[i]}
                  data-ocid={`admin.pin.input.${i + 1}`}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-14 h-16 text-center text-2xl font-mono font-bold rounded-xl border-2 bg-secondary text-foreground transition-all outline-none
                    ${error ? "border-destructive" : pin[i] ? "border-primary" : "border-border"}
                    focus:border-primary focus:shadow-neon-blue-sm`}
                />
              ))}
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                data-ocid="admin.pin.error_state"
                className="text-sm text-destructive font-body mb-4"
              >
                Incorrect PIN. Access denied.
              </motion.p>
            )}

            <Button
              type="submit"
              data-ocid="admin.pin.submit.primary_button"
              disabled={pin.join("").length < 4}
              className="w-full py-6 font-display font-bold bg-primary text-primary-foreground hover:shadow-neon-blue transition-all disabled:opacity-50"
            >
              Unlock Portal
            </Button>
          </form>

          <p className="text-xs text-muted-foreground/50 font-body mt-4">
            Authorized personnel only
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sidebar Navigation ────────────────────────────────────────────────────

interface NavItem {
  id: Section;
  label: string;
  icon: React.ReactNode;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: "users",
    label: "User Management",
    icon: <Users className="w-4 h-4" />,
    group: "Content",
  },
  {
    id: "officers",
    label: "Officer Management",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: "services",
    label: "Services Management",
    icon: <Wrench className="w-4 h-4" />,
  },
  {
    id: "portfolio",
    label: "Portfolio Management",
    icon: <Image className="w-4 h-4" />,
  },
  {
    id: "media_manager",
    label: "Media Manager",
    icon: <FolderOpen className="w-4 h-4" />,
    group: "Content",
  },
  {
    id: "reviews",
    label: "Reviews Management",
    icon: <Star className="w-4 h-4" />,
  },
  {
    id: "submissions",
    label: "Contact Submissions",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    id: "orders",
    label: "Order Management",
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    id: "spam",
    label: "Spam / Block List",
    icon: <Ban className="w-4 h-4" />,
    group: "Security",
  },
  {
    id: "reported_issues",
    label: "Reported Issues",
    icon: <AlertTriangle className="w-4 h-4" />,
    group: "Support",
  },
  {
    id: "payment_settings",
    label: "Payment Settings",
    icon: <CreditCard className="w-4 h-4" />,
    group: "System",
  },
  {
    id: "ai_logs",
    label: "AI Chat Logs",
    icon: <MessageSquare className="w-4 h-4" />,
    group: "Support",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
  },
];

function Sidebar({
  active,
  onNavigate,
  onClose,
  badgeCounts,
}: {
  active: Section;
  onNavigate: (s: Section) => void;
  onClose?: () => void;
  badgeCounts?: Partial<Record<Section, number>>;
}) {
  let lastGroup = "";

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-foreground leading-tight">
              A AND A GROUP
            </p>
            <p className="text-[10px] text-primary font-body uppercase tracking-wider">
              Admin Portal
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 p-3">
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const showGroup = item.group && item.group !== lastGroup;
            if (item.group) lastGroup = item.group;
            const isActive = active === item.id;
            const badgeCount = badgeCounts?.[item.id] ?? 0;

            return (
              <div key={item.id}>
                {showGroup && (
                  <p className="text-[10px] font-body font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 pt-4 pb-1">
                    {item.group}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    onClose?.();
                  }}
                  data-ocid={`admin.nav.${item.id}.link`}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 font-body text-sm
                    ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                >
                  <span className={isActive ? "text-primary" : "text-current"}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex-shrink-0">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}

// ─── Dashboard Section ─────────────────────────────────────────────────────

function DashboardSection() {
  const { data: services, isLoading: svcLoading } = useListServices();
  const { data: submissions, isLoading: subLoading } = useListSubmissions();
  const { data: portfolio, isLoading: portLoading } = useListPortfolio();
  const { data: reviews, isLoading: revLoading } = useListReviews();
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const { data: allDashboardReports = [] } = useListProblemReports();
  const pendingReports = allDashboardReports.filter(
    (r) => r.status === "pending",
  ).length;
  const { data: allOrders = [] } = useListAllOrders();

  useEffect(() => {
    setUsers(getUsers());
    setOfficers(getOfficers());
    // Use backend orders count — central server is the source of truth
    setOrderCount(allOrders.length);
  }, [allOrders]);

  // Count unique users from backend submissions (user registrations saved with USER_REGISTRATION prefix)
  const backendUserCount = submissions
    ? new Set(
        submissions
          .filter((s) => s.projectDetails?.startsWith("USER_REGISTRATION|"))
          .map((s) =>
            s.email.replace("user_reg_", "").replace("@aag.internal", ""),
          ),
      ).size
    : 0;

  // Use backend submission count as the authoritative user count
  const totalUserCount = backendUserCount;
  const unreadCount =
    submissions?.filter(
      (s) => !s.isRead && !s.projectDetails?.startsWith("USER_REGISTRATION|"),
    ).length ?? 0;

  const cards = [
    {
      label: "Total Registered Users",
      value: totalUserCount,
      icon: <Users className="w-5 h-5" />,
      color: "primary",
      loading: subLoading,
      // Value comes from backend submissions (central server) only
    },
    {
      label: "Active Officers",
      value: officers.length,
      icon: <Shield className="w-5 h-5" />,
      color: "accent",
    },
    {
      label: "Total Services",
      value: services?.length ?? 0,
      icon: <Wrench className="w-5 h-5" />,
      color: "primary",
      loading: svcLoading,
    },
    {
      label: "Unread Submissions",
      value: unreadCount,
      icon: <MessageSquare className="w-5 h-5" />,
      color: "destructive",
      loading: subLoading,
    },
    {
      label: "Pending Reports",
      value: pendingReports,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "amber",
    },
    {
      label: "Portfolio Items",
      value: portfolio?.length ?? 0,
      icon: <Image className="w-5 h-5" />,
      color: "accent",
      loading: portLoading,
    },
    {
      label: "Total Reviews",
      value: reviews?.length ?? 0,
      icon: <Star className="w-5 h-5" />,
      color: "primary",
      loading: revLoading,
    },
    {
      label: "Total Orders",
      value: orderCount,
      icon: <ClipboardList className="w-5 h-5" />,
      color: "accent",
    },
  ];

  const recentUsers = [...users]
    .sort(
      (a, b) =>
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    )
    .slice(0, 5);

  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Overview of your platform activity
        </p>
      </div>

      {/* Analytics Grid */}
      <div
        data-ocid="admin.dashboard.section"
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            data-ocid={`admin.dashboard.card.${i + 1}`}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 hover:shadow-neon-blue-sm transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorMap[card.color]}`}
              >
                {card.icon}
              </div>
            </div>
            {card.loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="font-display font-bold text-3xl text-foreground">
                {card.value}
              </div>
            )}
            <div className="text-xs text-muted-foreground font-body mt-1">
              {card.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Users */}
      <div>
        <h3 className="font-display font-semibold text-base text-foreground mb-4">
          Recently Registered Users
        </h3>
        {recentUsers.length === 0 ? (
          <div
            data-ocid="admin.recent_users.empty_state"
            className="text-center py-10 border border-dashed border-border rounded-xl"
          >
            <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-body">
              No users registered yet.
            </p>
          </div>
        ) : (
          <div
            data-ocid="admin.recent_users.table"
            className="rounded-xl border border-border overflow-hidden"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    User Code
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                    Registered
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => (
                  <tr
                    key={u.userCode}
                    data-ocid={`admin.recent_users.row.${i + 1}`}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-body text-foreground">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-primary text-xs">
                      {u.userCode}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-body text-xs hidden sm:table-cell">
                      {new Date(u.registeredAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`text-[10px] font-body ${
                          u.isBlocked
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {u.isBlocked ? "Blocked" : "Active"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── User Management Section ───────────────────────────────────────────────

function UserManagementSection() {
  const [localUsers, setLocalUsers] = useState<SiteUser[]>(() => getUsers());
  const { data: submissions } = useListSubmissions();
  const [search, setSearch] = useState("");
  const [confirmBlock, setConfirmBlock] = useState<SiteUser | null>(null);

  // Merge local users with backend-registered users (deduplicate by userCode)
  const users: SiteUser[] = (() => {
    const merged = [...localUsers];
    const backendUsers = submissions ? parseBackendUsers(submissions) : [];
    for (const bu of backendUsers) {
      if (!merged.find((u) => u.userCode === bu.userCode)) {
        merged.push(bu);
      }
    }
    return merged;
  })();

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.userCode.includes(search),
  );

  const handleToggleBlock = (user: SiteUser) => {
    if (user.isBlocked) {
      unblockUser(user.userCode);
      toast.success(`${user.name} has been unblocked.`);
      setLocalUsers(getUsers());
    } else {
      setConfirmBlock(user);
    }
  };

  const confirmBlockUser = () => {
    if (!confirmBlock) return;
    blockUser(confirmBlock.userCode);
    toast.success(`${confirmBlock.name} has been blocked.`);
    setLocalUsers(getUsers());
    setConfirmBlock(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-1">
            User Management
          </h2>
          <p className="text-sm text-muted-foreground font-body">
            {users.length} registered users
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border border-primary/20 font-body text-sm px-3 py-1">
          {users.length} total
        </Badge>
      </div>

      <Input
        data-ocid="admin.users.search_input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or user code..."
        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
      />

      {filtered.length === 0 ? (
        <div
          data-ocid="admin.users.empty_state"
          className="text-center py-16 border border-dashed border-border rounded-xl"
        >
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            {search
              ? "No users match your search."
              : "No users registered yet."}
          </p>
        </div>
      ) : (
        <div
          data-ocid="admin.users.table"
          className="rounded-xl border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    User Code
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                    Registered
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr
                    key={u.userCode}
                    data-ocid={`admin.users.row.${i + 1}`}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-body text-foreground font-medium">
                      {u.name}
                      {isOfficer(u.userCode) && (
                        <Badge className="ml-2 text-[9px] bg-accent/10 text-accent border border-accent/20">
                          Officer
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-primary text-xs">
                      {u.userCode}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-body text-xs hidden md:table-cell">
                      {new Date(u.registeredAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`text-[10px] font-body ${
                          u.isBlocked
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {u.isBlocked ? "Blocked" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleBlock(u)}
                        data-ocid={
                          u.isBlocked
                            ? `admin.users.unblock.button.${i + 1}`
                            : `admin.users.block.button.${i + 1}`
                        }
                        className={`h-7 text-xs font-body ${
                          u.isBlocked
                            ? "text-emerald-400 hover:bg-emerald-400/10"
                            : "text-destructive hover:bg-destructive/10"
                        }`}
                      >
                        {u.isBlocked ? "Unblock" : "Block"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Block Confirm Dialog */}
      <AlertDialog
        open={!!confirmBlock}
        onOpenChange={(o) => !o && setConfirmBlock(null)}
      >
        <AlertDialogContent
          data-ocid="admin.block.dialog"
          className="glass border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground flex items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" />
              Block User
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              Block <strong>{confirmBlock?.name}</strong> (Code:{" "}
              {confirmBlock?.userCode})? They will not be able to submit contact
              forms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.block.cancel_button"
              className="border-border text-muted-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlockUser}
              data-ocid="admin.block.confirm_button"
              className="bg-destructive text-destructive-foreground"
            >
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Officer Management Section ────────────────────────────────────────────

function OfficerManagementSection() {
  const [officers, setOfficers] = useState<Officer[]>(() => getOfficers());
  const [promoteCode, setPromoteCode] = useState("");
  const [codePreview, setCodePreview] = useState<SiteUser | null>(null);
  const [codeError, setCodeError] = useState("");
  const [permissions, setPermissions] =
    useState<OfficerPermissions>(DEFAULT_PERMISSIONS);
  const [isPromoting, setIsPromoting] = useState(false);
  const [editOfficer, setEditOfficer] = useState<Officer | null>(null);
  const [editPerms, setEditPerms] =
    useState<OfficerPermissions>(DEFAULT_PERMISSIONS);
  const [demoteTarget, setDemoteTarget] = useState<Officer | null>(null);
  const { data: submissions } = useListSubmissions();

  const handleCodeChange = (val: string) => {
    setPromoteCode(val);
    setCodeError("");
    if (val.length === 7) {
      // 1. Check localStorage (same device)
      const found = getUser(val);
      if (found) {
        setCodePreview(found);
        setCodeError("");
        return;
      }
      // 2. Check backend-registered users (other devices / central server)
      if (submissions) {
        const backendUsers = parseBackendUsers(submissions);
        const backendFound = backendUsers.find((u) => u.userCode === val);
        if (backendFound) {
          setCodePreview(backendFound);
          setCodeError("");
          return;
        }
      }
      // 3. Allow promoting by code even if user not in backend yet
      //    (user may have registered before backend sync was set up)
      //    Show a generic preview so admin can still promote
      setCodePreview({
        userCode: val,
        name: `User ${val}`,
        registeredAt: new Date().toISOString(),
        isBlocked: false,
      });
      setCodeError("");
    } else {
      setCodePreview(null);
    }
  };

  const handlePromote = () => {
    if (!codePreview) return;
    if (isOfficer(codePreview.userCode)) {
      toast.error("This user is already an officer.");
      return;
    }
    setIsPromoting(true);
    addOfficer({
      userCode: codePreview.userCode,
      name: codePreview.name,
      promotedAt: new Date().toISOString(),
      permissions,
    });
    toast.success(`${codePreview.name} promoted to Officer!`);
    setOfficers(getOfficers());
    setPromoteCode("");
    setCodePreview(null);
    setPermissions(DEFAULT_PERMISSIONS);
    setIsPromoting(false);
  };

  const openEditPerms = (officer: Officer) => {
    setEditOfficer(officer);
    setEditPerms({ ...officer.permissions });
  };

  const saveEditPerms = () => {
    if (!editOfficer) return;
    updateOfficer(editOfficer.userCode, editPerms);
    toast.success("Permissions updated!");
    setOfficers(getOfficers());
    setEditOfficer(null);
  };

  const confirmDemote = () => {
    if (!demoteTarget) return;
    removeOfficer(demoteTarget.userCode);
    toast.success(`${demoteTarget.name} removed from officers.`);
    setOfficers(getOfficers());
    setDemoteTarget(null);
  };

  const togglePerm = (
    _perms: OfficerPermissions,
    key: keyof OfficerPermissions,
    setter: React.Dispatch<React.SetStateAction<OfficerPermissions>>,
  ) => {
    setter((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          Officer Management
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Promote users to officers and manage their permissions
        </p>
      </div>

      {/* Promote Form */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <h3 className="font-display font-semibold text-base text-foreground mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" />
          Promote User to Officer
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              7-Digit User Code
            </Label>
            <div className="flex gap-3">
              <Input
                data-ocid="admin.officers.code.input"
                value={promoteCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Enter 7-digit code (e.g. 4837291)"
                maxLength={7}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 font-mono"
              />
            </div>
            {codeError && (
              <p
                data-ocid="admin.officers.code.error_state"
                className="text-xs text-destructive font-body"
              >
                {codeError}
              </p>
            )}
            {codePreview && (
              <div
                data-ocid="admin.officers.preview.card"
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-display font-semibold text-foreground">
                    {codePreview.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-body ml-2">
                    Code: {codePreview.userCode}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Permissions Checklist */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Grant Permissions
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                Object.keys(PERMISSION_LABELS) as (keyof OfficerPermissions)[]
              ).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePerm(permissions, key, setPermissions)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all text-left w-full"
                >
                  <Checkbox
                    checked={permissions[key]}
                    onCheckedChange={() =>
                      togglePerm(permissions, key, setPermissions)
                    }
                    data-ocid={`admin.officers.perm.${key}.checkbox`}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-xs font-body text-muted-foreground">
                    {PERMISSION_LABELS[key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handlePromote}
            data-ocid="admin.officers.promote.primary_button"
            disabled={!codePreview || isPromoting}
            className="bg-primary text-primary-foreground hover:shadow-neon-blue-sm"
          >
            {isPromoting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            Promote to Officer
          </Button>
        </div>
      </div>

      {/* Officers List */}
      <div>
        <h3 className="font-display font-semibold text-base text-foreground mb-4">
          Current Officers ({officers.length})
        </h3>
        {officers.length === 0 ? (
          <div
            data-ocid="admin.officers.empty_state"
            className="text-center py-12 border border-dashed border-border rounded-xl"
          >
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-body">
              No officers yet. Promote a user above.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {officers.map((officer, i) => (
              <motion.div
                key={officer.userCode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                data-ocid={`admin.officers.card.${i + 1}`}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm text-foreground">
                          {officer.name}
                        </p>
                        <p className="font-mono text-xs text-primary">
                          {officer.userCode}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-body mt-2">
                      Promoted:{" "}
                      {new Date(officer.promotedAt).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </p>
                  </div>
                </div>

                {/* Permission Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(
                    Object.keys(
                      PERMISSION_LABELS,
                    ) as (keyof OfficerPermissions)[]
                  )
                    .filter((k) => officer.permissions[k])
                    .map((k) => (
                      <Badge
                        key={k}
                        className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-body"
                      >
                        {PERMISSION_LABELS[k]}
                      </Badge>
                    ))}
                  {Object.values(officer.permissions).every((v) => !v) && (
                    <span className="text-xs text-muted-foreground font-body italic">
                      No permissions granted
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditPerms(officer)}
                    data-ocid={`admin.officers.edit_button.${i + 1}`}
                    className="flex-1 border-border text-muted-foreground hover:text-primary hover:border-primary/30 h-8 text-xs"
                  >
                    Edit Permissions
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDemoteTarget(officer)}
                    data-ocid={`admin.officers.delete_button.${i + 1}`}
                    className="text-destructive hover:bg-destructive/10 h-8 text-xs"
                  >
                    Demote
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog
        open={!!editOfficer}
        onOpenChange={(o) => !o && setEditOfficer(null)}
      >
        <DialogContent
          data-ocid="admin.officers.edit.dialog"
          className="glass border-border sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              Edit Permissions — {editOfficer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(
              Object.keys(PERMISSION_LABELS) as (keyof OfficerPermissions)[]
            ).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => togglePerm(editPerms, key, setEditPerms)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-all text-left w-full"
              >
                <Checkbox
                  checked={editPerms[key]}
                  onCheckedChange={() =>
                    togglePerm(editPerms, key, setEditPerms)
                  }
                  data-ocid={`admin.officers.edit.perm.${key}.checkbox`}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm font-body text-muted-foreground">
                  {PERMISSION_LABELS[key]}
                </span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOfficer(null)}
              data-ocid="admin.officers.edit.cancel_button"
              className="border-border text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={saveEditPerms}
              data-ocid="admin.officers.edit.save_button"
              className="bg-primary text-primary-foreground hover:shadow-neon-blue-sm"
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demote Confirm */}
      <AlertDialog
        open={!!demoteTarget}
        onOpenChange={(o) => !o && setDemoteTarget(null)}
      >
        <AlertDialogContent
          data-ocid="admin.officers.demote.dialog"
          className="glass border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              Demote Officer
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              Remove officer status from <strong>{demoteTarget?.name}</strong>?
              All their permissions will be revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.officers.demote.cancel_button"
              className="border-border text-muted-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDemote}
              data-ocid="admin.officers.demote.confirm_button"
              className="bg-destructive text-destructive-foreground"
            >
              Demote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Spam / Block List Section ─────────────────────────────────────────────

function SpamSection() {
  const [users, setUsers] = useState<SiteUser[]>(() =>
    getUsers().filter((u) => u.isBlocked),
  );

  const handleUnblock = (user: SiteUser) => {
    unblockUser(user.userCode);
    toast.success(`${user.name} has been unblocked.`);
    setUsers(getUsers().filter((u) => u.isBlocked));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          Spam / Block List
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Manage users blocked from submitting forms
        </p>
      </div>

      {users.length === 0 ? (
        <div
          data-ocid="admin.spam.empty_state"
          className="text-center py-16 border border-dashed border-border rounded-xl"
        >
          <Ban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            No blocked users.
          </p>
        </div>
      ) : (
        <div data-ocid="admin.spam.list" className="space-y-3">
          {users.map((user, i) => (
            <div
              key={user.userCode}
              data-ocid={`admin.spam.row.${i + 1}`}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                  <Ban className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-foreground">
                    {user.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Code: {user.userCode}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnblock(user)}
                data-ocid={`admin.spam.unblock.button.${i + 1}`}
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-8 text-xs"
              >
                Unblock
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Section ──────────────────────────────────────────────────────

function SettingsSection({ onLogout }: { onLogout: () => void }) {
  const [showPin, setShowPin] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Platform configuration and master admin info
        </p>
      </div>

      {/* Master Admin Card */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">
              Master Admin
            </h3>
            <p className="text-xs text-muted-foreground font-body">
              Platform owner and super administrator
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <span className="text-xs text-muted-foreground font-body">
              Email
            </span>
            <span className="text-sm font-body text-foreground">
              workfora.agroup@zohomail.in
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <span className="text-xs text-muted-foreground font-body">
              Admin PIN
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-foreground">
                {showPin ? ADMIN_PIN : "●●●●"}
              </span>
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                data-ocid="admin.settings.pin.toggle"
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle PIN visibility"
              >
                {showPin ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold text-base text-foreground mb-4">
          Platform Info
        </h3>
        <div className="space-y-3">
          {[
            { label: "Website Name", value: "A AND A GROUP" },
            { label: "Tagline", value: "All Digital Services in One Place" },
            { label: "WhatsApp", value: "+91 73808 69635" },
            { label: "Email", value: "workfora.agroup@zohomail.in" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
            >
              <span className="text-xs text-muted-foreground font-body">
                {item.label}
              </span>
              <span className="text-sm font-body text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <h3 className="font-display font-semibold text-base text-destructive mb-2">
          Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground font-body mb-4">
          Sign out of the admin portal. The PIN will be required again.
        </p>
        <Button
          variant="outline"
          onClick={onLogout}
          data-ocid="admin.settings.signout.button"
          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────

export default function AdminPage() {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: submissions } = useListSubmissions();

  const [pinVerified, setPinVerifiedState] = useState(isPinVerified);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seenReportIds, setSeenReportIds] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem("aag_seen_report_ids");
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const { data: allBackendReports = [] } = useListProblemReports();

  // Unread = backend reports not yet seen in this session
  const unreadReports = allBackendReports.filter(
    (r) => !seenReportIds.has(r.id.toString()) && r.status === "pending",
  ).length;

  // Recompute badge counts when section changes
  const handleNavigate = (s: Section) => {
    setActiveSection(s);
  };

  const handleReportsRead = () => {
    try {
      const ids = allBackendReports.map((r) => r.id.toString());
      const updated = new Set([...seenReportIds, ...ids]);
      setSeenReportIds(updated);
      sessionStorage.setItem(
        "aag_seen_report_ids",
        JSON.stringify([...updated]),
      );
    } catch {
      /* ignore */
    }
  };

  const unreadSubmissions = submissions?.filter((s) => !s.isRead).length ?? 0;

  const badgeCounts: Partial<Record<Section, number>> = {
    reported_issues: unreadReports,
    submissions: unreadSubmissions,
  };

  const isAuthenticated = !!identity;

  const handleLogin = async () => {
    try {
      await login();
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === "User is already authenticated") {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    await clear();
    setPinVerified(false);
    setPinVerifiedState(false);
    queryClient.clear();
  };

  // ── PIN Screen ────────────────────────────────────────────────────────────
  if (!pinVerified) {
    return (
      <PinScreen
        onSuccess={() => {
          setPinVerifiedState(true);
        }}
      />
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <main className="pt-24 pb-24 min-h-screen flex items-center justify-center">
        <div
          data-ocid="admin.loading_state"
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground font-body text-sm">
            Initializing...
          </p>
        </div>
      </main>
    );
  }

  // ── Internet Identity Login ───────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <main className="pt-24 pb-24 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-10 text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/30 mx-auto mb-6">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground mb-2">
              Admin Identity
            </h1>
            <p className="text-muted-foreground font-body text-sm mb-2">
              PIN verified. Now authenticate with Internet Identity.
            </p>
            <p className="text-xs text-muted-foreground/60 font-body mb-8">
              Only the master admin principal has access.
            </p>
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              data-ocid="auth.login.primary_button"
              className="w-full py-6 font-display font-bold text-base bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Login with Internet Identity"
              )}
            </Button>
            <p className="text-xs text-muted-foreground font-body mt-4">
              Secure auth via Internet Computer identity
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  // ── Access Guard — user code check ───────────────────────────────────────
  const currentUser = getCurrentUser();
  const currentUserCode = currentUser?.code ?? "";
  const isMasterAdmin = currentUserCode === MASTER_ADMIN_CODE;
  const isOfficerUser = isOfficer(currentUserCode);

  if (!isMasterAdmin && !isOfficerUser) {
    return (
      <main className="pt-24 pb-24 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="admin.access_denied.panel"
            className="rounded-2xl border border-destructive/30 bg-card p-10 text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-destructive/10 border border-destructive/30 mx-auto mb-6">
              <ShieldAlert className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground mb-2">
              Access Denied
            </h1>
            <p className="text-muted-foreground font-body text-sm mb-2">
              Your user code{" "}
              <span className="font-mono text-foreground">
                {currentUserCode || "unknown"}
              </span>{" "}
              does not have Admin or Officer access.
            </p>
            <p className="text-xs text-muted-foreground/60 font-body mb-8">
              Only the permanent Admin (code: 1649963) and assigned Officers can
              access the Admin Portal.
            </p>
            <Button
              onClick={handleLogout}
              data-ocid="admin.access_denied.logout.button"
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </main>
    );
  }

  // ── Full Dashboard ────────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "users":
        return isMasterAdmin ? <UserManagementSection /> : <DashboardSection />;
      case "officers":
        return isMasterAdmin ? (
          <OfficerManagementSection />
        ) : (
          <DashboardSection />
        );
      case "services":
        return <AdminServicesTab />;
      case "portfolio":
        return <AdminPortfolioTab />;
      case "media_manager":
        return <AdminMediaManagerTab />;
      case "reviews":
        return <AdminReviewsTab />;
      case "submissions":
        return <AdminSubmissionsTab />;
      case "orders":
        return <AdminOrdersTab />;
      case "spam":
        return isMasterAdmin ? <SpamSection /> : <DashboardSection />;
      case "reported_issues":
        return <AdminReportedIssuesTab onReportsRead={handleReportsRead} />;
      case "payment_settings":
        return <AdminPaymentSettingsTab />;
      case "ai_logs":
        return isMasterAdmin ? <AdminAIChatLogsTab /> : <DashboardSection />;
      case "settings":
        return <SettingsSection onLogout={handleLogout} />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      {/* Top Header Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 h-12 border-b border-border bg-card/80 backdrop-blur flex items-center px-4 gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          data-ocid="admin.sidebar.toggle"
          className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <span className="font-display font-bold text-sm text-foreground hidden sm:block">
            A AND A GROUP
          </span>
          <span className="text-muted-foreground/40 hidden sm:block">—</span>
          <span className="text-xs text-primary font-body uppercase tracking-widest">
            Admin Portal
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          data-ocid="auth.logout.button"
          className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Sign Out</span>
        </Button>
      </div>

      <div className="flex flex-1 pt-12">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 fixed top-28 bottom-0 left-0 border-r border-border bg-card/60 backdrop-blur-sm z-30">
          <Sidebar
            active={activeSection}
            onNavigate={handleNavigate}
            badgeCounts={badgeCounts}
          />
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 bottom-0 w-64 z-50 bg-card border-r border-border lg:hidden"
              >
                <Sidebar
                  active={activeSection}
                  onNavigate={handleNavigate}
                  onClose={() => setSidebarOpen(false)}
                  badgeCounts={badgeCounts}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-full">
          <div className="p-6 lg:p-8 max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
