import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  CheckCircle2,
  Clock,
  Image,
  MessageCircle,
  Package,
  Search,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { OrderRecord } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useBlobStorage } from "../hooks/useBlobStorage";
import type { Order, OrderStatus, PaymentStatus } from "../utils/localData";

// ─── Backend → Local converter ──────────────────────────────────────────────

function backendOrderToLocal(o: OrderRecord): Order {
  return {
    id: o.id.toString(),
    orderId: o.orderId,
    name: o.name,
    email: o.email,
    whatsappNumber: o.whatsappNumber,
    service: o.service,
    projectDetails: o.projectDetails,
    budget: o.budget,
    deadline: o.deadline,
    status: o.status as OrderStatus,
    paymentStatus: (o.paymentStatus ?? "pending") as PaymentStatus,
    createdAt: new Date(Number(o.createdAt) / 1_000_000).toISOString(),
    screenshotBlobId: o.screenshotBlobId,
  };
}

// ─── Step config ────────────────────────────────────────────────────────────

const STEPS: {
  id: OrderStatus;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "received",
    label: "Pending",
    sublabel: "Order received",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: "inProgress",
    label: "In Progress",
    sublabel: "Work started by team",
    icon: <Truck className="w-5 h-5" />,
  },
  {
    id: "completed",
    label: "Completed",
    sublabel: "Project delivered",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
];

const STEP_INDEX: Record<OrderStatus, number> = {
  received: 0,
  inProgress: 1,
  completed: 2,
};

const PAYMENT_BADGE: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
  paid: {
    label: "Paid",
    cls: "bg-primary/10 text-primary border border-primary/20",
  },
  completed: {
    label: "Completed",
    cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
};

// ─── Progress Indicator ────────────────────────────────────────────────────

function StepIndicator({ status }: { status: OrderStatus }) {
  const currentIdx = STEP_INDEX[status];

  return (
    <div className="mt-8">
      <div className="relative flex items-start justify-between">
        {/* Connecting lines */}
        <div className="absolute top-5 left-0 right-0 flex items-center px-[calc(50%/3)]">
          {[0, 1].map((lineIdx) => {
            const filled = lineIdx < currentIdx;
            return (
              <div
                key={lineIdx}
                className="flex-1 h-[2px] mx-1 rounded-full overflow-hidden bg-border"
                style={{ margin: "0 2%" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: filled ? "oklch(0.75 0.18 210)" : "transparent",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: filled ? "100%" : "0%" }}
                  transition={{ duration: 0.6, delay: lineIdx * 0.2 }}
                />
              </div>
            );
          })}
        </div>

        {/* Steps */}
        {STEPS.map((step, idx) => {
          const isCurrent = idx === currentIdx;
          const isCompleted = idx < currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-2 relative z-10 flex-1"
            >
              {/* Circle */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.12, duration: 0.4 }}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? "border-primary bg-primary/15 text-primary"
                    : isCompleted
                      ? "border-primary/60 bg-primary/10 text-primary/70"
                      : "border-border bg-secondary/30 text-muted-foreground/40"
                }`}
                style={
                  isCurrent
                    ? {
                        boxShadow:
                          "0 0 20px oklch(0.75 0.18 210 / 0.6), 0 0 40px oklch(0.75 0.18 210 / 0.25)",
                      }
                    : undefined
                }
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                ) : (
                  step.icon
                )}
              </motion.div>

              {/* Labels */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12 + 0.1 }}
              >
                <p
                  className={`text-xs font-display font-semibold ${
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                        ? "text-foreground/70"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-[10px] font-body mt-0.5 hidden sm:block ${
                    isPending
                      ? "text-muted-foreground/30"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {step.sublabel}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Screenshot Viewer ────────────────────────────────────────────────────

function ScreenshotViewer({ blobId }: { blobId: string }) {
  const { getFileUrl } = useBlobStorage();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getFileUrl(blobId)
      .then((u) => {
        if (!cancelled) {
          setUrl(u);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [blobId, getFileUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <p className="text-xs text-muted-foreground font-body py-2">
        Unable to load screenshot.
      </p>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={url}
        alt="Payment screenshot"
        className="max-w-full rounded-xl border border-border hover:border-primary/40 transition-all cursor-pointer"
        style={{ maxHeight: 200, objectFit: "contain" }}
      />
    </a>
  );
}

// ─── Order Result Card ─────────────────────────────────────────────────────

function OrderResultCard({ order }: { order: Order }) {
  const paymentStatus = order.paymentStatus ?? "pending";
  const badge = PAYMENT_BADGE[paymentStatus] ?? PAYMENT_BADGE.pending;
  const [chatOpen, setChatOpen] = useState(false);

  const waText = encodeURIComponent(
    `Hello A AND A GROUP\nI want to check my order.\nOrder ID: ${order.orderId}`,
  );
  const waUrl = `https://wa.me/917380869635?text=${waText}`;

  const adminChatWa = encodeURIComponent(
    `Hello A AND A GROUP, I want to discuss my order.\nOrder ID: ${order.orderId}\nClient: ${order.name}`,
  );
  const adminChatUrl = `https://wa.me/917380869635?text=${adminChatWa}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      data-ocid="track.order.card"
      className="rounded-2xl border border-primary/30 bg-card/80 p-6 space-y-5"
      style={{
        boxShadow: "0 0 30px oklch(0.75 0.18 210 / 0.1)",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-body uppercase tracking-widest text-muted-foreground mb-1">
            Order ID
          </p>
          <span className="font-mono font-bold text-xl text-primary tracking-wider">
            {order.orderId}
          </span>
        </div>
        <Badge className={`text-xs font-body ${badge.cls}`}>
          💳 Payment: {badge.label}
        </Badge>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 text-sm border-t border-border/50 pt-4">
        <div>
          <p className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 mb-1">
            Selected Service
          </p>
          <p className="font-display font-semibold text-foreground">
            {order.service}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 mb-1">
            Order Date
          </p>
          <p className="font-body text-foreground/90">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="border-t border-border/50 pt-4">
        <p className="text-[10px] font-body uppercase tracking-widest text-muted-foreground mb-1">
          Order Progress
        </p>
        <StepIndicator status={order.status} />
      </div>

      {/* Payment Screenshot */}
      <div className="border-t border-border/50 pt-4">
        <p className="text-[10px] font-body uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <Image className="w-3 h-3" />
          Payment Screenshot
        </p>
        {order.screenshotBlobId ? (
          <ScreenshotViewer blobId={order.screenshotBlobId} />
        ) : (
          <p className="text-xs text-muted-foreground/60 font-body italic">
            No screenshot uploaded
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-border/50 pt-4 flex flex-col gap-2 sm:flex-row">
        {/* Admin Chat */}
        <Button
          variant="outline"
          onClick={() => setChatOpen(true)}
          data-ocid="track.admin_chat.button"
          className="flex-1 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Chat with Admin
        </Button>

        {/* Contact Support */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-ocid="track.contact_support.button"
          className="flex-1"
        >
          <Button
            variant="outline"
            className="w-full border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/60 gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Support
          </Button>
        </a>
      </div>

      {/* Admin Chat Modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent
          data-ocid="track.admin_chat.dialog"
          className="glass border-border sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Chat with Admin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 mb-1">
                Pre-filled Message
              </p>
              <p className="text-sm font-body text-foreground/80 leading-relaxed">
                Hello A AND A GROUP, I want to discuss my order.
                <br />
                <strong>Order ID: {order.orderId}</strong>
                <br />
                Client: {order.name}
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              This will open WhatsApp with your order details pre-filled.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setChatOpen(false)}
                data-ocid="track.admin_chat.cancel_button"
                className="flex-1 border-border text-muted-foreground"
              >
                Cancel
              </Button>
              <a
                href={adminChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
                onClick={() => setChatOpen(false)}
              >
                <Button
                  data-ocid="track.admin_chat.confirm_button"
                  className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Not Found State ───────────────────────────────────────────────────────

function NotFoundCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      data-ocid="track.not_found.error_state"
      className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
    >
      <XCircle className="w-12 h-12 text-destructive/50 mx-auto mb-4" />
      <p className="font-display font-semibold text-foreground mb-2">
        Order Not Found
      </p>
      <p className="text-sm text-muted-foreground font-body">
        Order not found. Please check your Order ID and try again.
      </p>
    </motion.div>
  );
}

// ─── Paginated Email Results ───────────────────────────────────────────────

const PAGE_SIZE = 5;

function EmailResults({ orders }: { orders: Order[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(orders.length / PAGE_SIZE);
  const paged = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-body">
        Found <strong className="text-foreground">{orders.length}</strong> order
        {orders.length !== 1 ? "s" : ""} for this email
      </p>
      {paged.map((order) => (
        <OrderResultCard key={order.id} order={order} />
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            data-ocid="track.pagination_prev"
            className="border-border text-muted-foreground h-8 text-xs"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground font-body px-2">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            data-ocid="track.pagination_next"
            className="border-border text-muted-foreground h-8 text-xs"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

type SearchMode = "orderId" | "email";
type SearchResult = Order | Order[] | "not_found" | null;

export default function TrackOrderPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("orderId");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { actor } = useActor();

  // Reset on mode change
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setQuery("");
    setResult(null);
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);

    try {
      const trimmed = query.trim();

      if (searchMode === "orderId") {
        // Backend is the only source of truth
        if (actor) {
          const backendOrder = await actor.getOrderByOrderId(trimmed);
          if (backendOrder) {
            setResult(backendOrderToLocal(backendOrder));
          } else {
            setResult("not_found");
          }
        } else {
          setResult("not_found");
        }
      } else {
        // Email search — backend only
        if (actor) {
          const backendOrders = await actor.getOrdersByEmail(trimmed);
          if (backendOrders && backendOrders.length > 0) {
            const converted = backendOrders
              .map(backendOrderToLocal)
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              );
            setResult(converted);
          } else {
            setResult("not_found");
          }
        } else {
          setResult("not_found");
        }
      }
    } finally {
      setIsSearching(false);
    }
  }, [query, searchMode, actor]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <main className="pt-24 pb-24 min-h-screen">
      {/* Background ambient */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 210) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-6 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.62 0.22 295) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-body font-medium mb-6"
          >
            <Package className="w-3.5 h-3.5" />
            My Orders
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-display font-bold text-4xl lg:text-5xl text-foreground mb-3"
          >
            My <span className="gradient-text">Orders</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="text-muted-foreground font-body text-sm max-w-md mx-auto"
          >
            Track your orders by Order ID or find all orders linked to your
            email
          </motion.p>
        </div>

        {/* Search Mode Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="flex rounded-xl border border-border bg-secondary/30 p-1 mb-4"
          data-ocid="track.search_mode.tab"
        >
          {(["orderId", "email"] as SearchMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeChange(mode)}
              data-ocid={`track.search_${mode}.tab`}
              className={`flex-1 py-2.5 rounded-lg text-xs font-body font-medium transition-all duration-200 ${
                searchMode === mode
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "orderId" ? "Search by Order ID" : "Search by Email"}
            </button>
          ))}
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-border bg-card/80 backdrop-blur p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <Label
              htmlFor="search-input"
              className="text-sm font-display font-semibold text-foreground"
            >
              {searchMode === "orderId" ? "Order ID" : "Email Address"}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground font-body mb-4">
            {searchMode === "orderId"
              ? "Format: AAG-XXXXXXX (e.g. AAG-4839201)"
              : "Enter the email address used when placing your order"}
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
              <Input
                id="search-input"
                data-ocid="track.order_id.input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (result) setResult(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  searchMode === "orderId"
                    ? "e.g. AAG-4839201"
                    : "your@email.com"
                }
                type={searchMode === "email" ? "email" : "text"}
                className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 font-mono"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              data-ocid="track.search.primary_button"
              className="bg-primary text-primary-foreground font-display font-semibold hover:shadow-neon-blue transition-all duration-300 hover:scale-105 px-6 disabled:opacity-50"
            >
              {isSearching ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Searching
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Search className="w-4 h-4" />
                  Track
                </span>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result === "not_found" && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NotFoundCard />
            </motion.div>
          )}
          {result && result !== "not_found" && !Array.isArray(result) && (
            <motion.div
              key={result.orderId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <OrderResultCard order={result} />
            </motion.div>
          )}
          {result && Array.isArray(result) && (
            <motion.div
              key="email-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmailResults orders={result} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info tip */}
        {!result && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground/50 font-body mt-4"
          >
            Your Order ID was sent to you after order submission (AAG-XXXXXXX
            format)
          </motion.p>
        )}
      </div>
    </main>
  );
}
