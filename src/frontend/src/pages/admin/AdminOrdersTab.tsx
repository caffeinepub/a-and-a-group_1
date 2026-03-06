import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Image, Mail, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { OrderRecord } from "../../backend.d";
import { useBlobStorage } from "../../hooks/useBlobStorage";
import {
  useListAllOrders,
  useUpdateOrderPaymentStatus,
  useUpdateOrderStatus,
} from "../../hooks/useQueries";
import type { OrderStatus, PaymentStatus } from "../../utils/localData";

// ─── Backend → display adapter ───────────────────────────────────────────────

interface DisplayOrder {
  id: bigint;
  orderId: string;
  name: string;
  email: string;
  whatsappNumber: string;
  service: string;
  projectDetails: string;
  budget: string;
  deadline: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  screenshotBlobId?: string;
}

function toDisplay(o: OrderRecord): DisplayOrder {
  return {
    id: o.id,
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

type FilterTab = "all" | OrderStatus;
type OrderLike = DisplayOrder;

// ─── Screenshot Modal ────────────────────────────────────────────────────────

function ScreenshotModal({
  blobId,
  onClose,
}: {
  blobId: string;
  onClose: () => void;
}) {
  const { getFileUrl } = useBlobStorage();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const u = await getFileUrl(blobId);
      setUrl(u);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [blobId, getFileUrl]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        data-ocid="admin.orders.screenshot.dialog"
        className="glass border-border sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            Payment Screenshot
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[200px]">
          {loading && (
            <span className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
          {error && (
            <p className="text-sm text-muted-foreground font-body">
              Unable to load screenshot.
            </p>
          )}
          {url && !loading && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              <img
                src={url}
                alt="Payment screenshot"
                className="max-w-full rounded-xl border border-border cursor-pointer hover:border-primary/40 transition-all"
                style={{ maxHeight: 400, objectFit: "contain" }}
              />
            </a>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-body underline underline-offset-2 hover:opacity-80 transition-opacity text-center block"
          >
            Open full size ↗
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  completed: "Completed",
};

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  paid: "bg-primary/10 text-primary border border-primary/20",
  completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Received",
  inProgress: "In Progress",
  completed: "Completed",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  received: "bg-primary/10 text-primary border border-primary/20",
  inProgress: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

function buildCompletionWhatsApp(order: OrderLike): string {
  return `Hello ${order.name}, your order ${order.orderId} has been completed by A AND A GROUP! Please contact us if you have any questions.`;
}

function buildCompletionEmailUrl(order: OrderLike): string {
  const subject = `Order Completed – ${order.orderId} – A AND A GROUP`;
  const body = `Hello ${order.name},\n\nWe are pleased to inform you that your order has been completed.\n\nOrder ID: ${order.orderId}\nService: ${order.service}\nBudget: ${order.budget}\nDeadline: ${order.deadline}\n\nThank you for choosing A AND A GROUP. Please contact us if you have any questions.\n\nBest regards,\nA AND A GROUP\nworkfora.agroup@zohomail.in`;
  return `mailto:${order.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function AdminOrdersTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [screenshotOrder, setScreenshotOrder] = useState<OrderLike | null>(
    null,
  );

  const { data: rawOrders = [], isLoading } = useListAllOrders();
  const { mutateAsync: updateStatus } = useUpdateOrderStatus();
  const { mutateAsync: updatePaymentStatus } = useUpdateOrderPaymentStatus();

  const orders: DisplayOrder[] = rawOrders.map(toDisplay);

  const handleStatusChange = async (order: OrderLike, status: OrderStatus) => {
    try {
      await updateStatus({ id: order.id, status });
      if (status === "completed") {
        toast.success(`Order ${order.orderId} marked as Completed!`);
      } else {
        toast.success("Order status updated.");
      }
    } catch {
      toast.error("Failed to update status. Please try again.");
    }
  };

  const handlePaymentStatusChange = async (
    order: OrderLike,
    status: PaymentStatus,
  ) => {
    try {
      await updatePaymentStatus({ id: order.id, paymentStatus: status });
      toast.success("Payment status updated.");
    } catch {
      toast.error("Failed to update payment status. Please try again.");
    }
  };

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      o.orderId.toLowerCase().includes(term) ||
      o.name.toLowerCase().includes(term) ||
      o.service.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  // Sort: newest first
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "received", label: "Received" },
    { id: "inProgress", label: "In Progress" },
    { id: "completed", label: "Completed" },
  ];

  if (isLoading) {
    return (
      <div data-ocid="admin.orders.loading_state" className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-1">
            Order Management
          </h2>
          <p className="text-sm text-muted-foreground font-body">
            Track and manage all client order requests
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border border-primary/20 font-body text-sm px-3 py-1">
          {orders.length} total
        </Badge>
      </div>

      {/* Search */}
      <Input
        data-ocid="admin.orders.search_input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by Order ID (AAG-...), client name, or service..."
        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
      />

      {/* Filter Tabs */}
      <div data-ocid="admin.orders.filter.tab" className="flex gap-2 flex-wrap">
        {filterTabs.map((tab) => {
          const count =
            tab.id === "all"
              ? orders.length
              : orders.filter((o) => o.status === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 border ${
                filter === tab.id
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                  filter === tab.id
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {sorted.length === 0 ? (
        <div
          data-ocid="admin.orders.empty_state"
          className="text-center py-16 border border-dashed border-border rounded-xl"
        >
          <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            {search || filter !== "all"
              ? "No orders match your search or filter."
              : "No orders yet. Orders will appear here once clients submit the form."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((order, i) => (
            <motion.div
              key={order.id.toString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              data-ocid={`admin.orders.row.${i + 1}`}
              className={`rounded-xl border bg-card p-5 transition-all duration-200 ${
                order.status === "completed"
                  ? "border-emerald-500/30 bg-emerald-500/3"
                  : "border-border hover:border-primary/20"
              }`}
            >
              <div className="flex flex-col gap-4">
                {/* Top Row */}
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap flex-1">
                    {/* Order ID */}
                    <span className="font-mono font-bold text-sm text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg tracking-wider">
                      {order.orderId}
                    </span>
                    {/* Order Status Badge */}
                    <Badge
                      className={`text-xs font-body ${STATUS_CLASS[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </Badge>
                    {/* Payment Status Badge */}
                    <Badge
                      className={`text-xs font-body ${PAYMENT_STATUS_CLASS[order.paymentStatus ?? "pending"]}`}
                    >
                      💳{" "}
                      {PAYMENT_STATUS_LABELS[order.paymentStatus ?? "pending"]}
                    </Badge>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                      Client
                    </span>
                    <span className="font-display font-semibold text-foreground">
                      {order.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                      Service
                    </span>
                    <span className="font-body text-foreground/90">
                      {order.service}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                      Budget
                    </span>
                    <span className="font-body text-foreground/90">
                      {order.budget}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                      Deadline
                    </span>
                    <span className="font-body text-foreground/90">
                      {order.deadline}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                      Submitted
                    </span>
                    <span className="font-body text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Project Details */}
                {order.projectDetails && (
                  <div>
                    <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block mb-1">
                      Project Details
                    </span>
                    <p className="text-xs font-body text-muted-foreground leading-relaxed line-clamp-2">
                      {order.projectDetails}
                    </p>
                  </div>
                )}

                {/* Actions Row */}
                <div className="flex items-center justify-between gap-3 flex-wrap border-t border-border/50 pt-3">
                  {/* Contact Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${order.whatsappNumber.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp ${order.name}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
                      title={`WhatsApp: ${order.whatsappNumber}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`mailto:${order.email}`}
                      aria-label={`Email ${order.name}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                      title={`Email: ${order.email}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                    <span className="text-xs text-muted-foreground font-mono ml-1">
                      {order.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Order Status Select */}
                    <Select
                      value={order.status}
                      onValueChange={(v) =>
                        handleStatusChange(order, v as OrderStatus)
                      }
                    >
                      <SelectTrigger
                        data-ocid={`admin.orders.status.select.${i + 1}`}
                        className={`w-36 h-8 text-xs font-body border ${STATUS_CLASS[order.status]} focus:ring-0 bg-transparent`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem
                          value="received"
                          className="text-xs font-body focus:bg-primary/10 focus:text-primary"
                        >
                          Received
                        </SelectItem>
                        <SelectItem
                          value="inProgress"
                          className="text-xs font-body focus:bg-amber-500/10 focus:text-amber-400"
                        >
                          In Progress
                        </SelectItem>
                        <SelectItem
                          value="completed"
                          className="text-xs font-body focus:bg-emerald-500/10 focus:text-emerald-400"
                        >
                          Completed
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Payment Status Select */}
                    <Select
                      value={order.paymentStatus ?? "pending"}
                      onValueChange={(v) =>
                        handlePaymentStatusChange(order, v as PaymentStatus)
                      }
                    >
                      <SelectTrigger
                        data-ocid={`admin.orders.payment_status.select.${i + 1}`}
                        className={`w-32 h-8 text-xs font-body border ${PAYMENT_STATUS_CLASS[order.paymentStatus ?? "pending"]} focus:ring-0 bg-transparent`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem
                          value="pending"
                          className="text-xs font-body focus:bg-amber-500/10 focus:text-amber-400"
                        >
                          💳 Pending
                        </SelectItem>
                        <SelectItem
                          value="paid"
                          className="text-xs font-body focus:bg-primary/10 focus:text-primary"
                        >
                          💳 Paid
                        </SelectItem>
                        <SelectItem
                          value="completed"
                          className="text-xs font-body focus:bg-emerald-500/10 focus:text-emerald-400"
                        >
                          💳 Completed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notify Client when Completed */}
                {order.status === "completed" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4"
                  >
                    <p className="text-xs font-body font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Order Completed — Notify Client
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={`https://wa.me/${order.whatsappNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(buildCompletionWhatsApp(order))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/25 transition-all"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp Client
                      </a>
                      <a
                        href={buildCompletionEmailUrl(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-all"
                      >
                        <Mail className="w-3 h-3" />
                        Email Client
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* Payment Screenshot & Contact Support */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {order.screenshotBlobId && (
                    <button
                      type="button"
                      onClick={() => setScreenshotOrder(order)}
                      data-ocid={`admin.orders.screenshot.button.${i + 1}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium border border-primary/30 bg-primary/8 text-primary hover:bg-primary/15 transition-all"
                    >
                      <Image className="w-3 h-3" />
                      View Payment Screenshot
                    </button>
                  )}
                  <a
                    href={`https://wa.me/917380869635?text=${encodeURIComponent(`Hello A AND A GROUP\nI want to check my order.\nOrder ID: ${order.orderId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid={`admin.orders.contact_support.button.${i + 1}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium border border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-secondary/50 transition-all"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Contact Support
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Screenshot Modal */}
      {screenshotOrder?.screenshotBlobId && (
        <ScreenshotModal
          blobId={screenshotOrder.screenshotBlobId}
          onClose={() => setScreenshotOrder(null)}
        />
      )}
    </div>
  );
}
