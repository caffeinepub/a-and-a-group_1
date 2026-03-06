import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  useDeleteProblemReport,
  useListProblemReports,
  useUpdateProblemReportStatus,
} from "../../hooks/useQueries";

const SEEN_REPORTS_KEY = "aag_seen_report_ids";

function getSeenIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_REPORTS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markAllSeen(ids: string[]) {
  try {
    const seen = getSeenIds();
    for (const id of ids) seen.add(id);
    sessionStorage.setItem(SEEN_REPORTS_KEY, JSON.stringify([...seen]));
  } catch {
    // ignore
  }
}

export default function AdminReportedIssuesTab({
  onReportsRead,
}: {
  onReportsRead?: () => void;
}) {
  const { data: reports = [], isLoading, refetch } = useListProblemReports();
  const { mutateAsync: updateStatus } = useUpdateProblemReportStatus();
  const { mutateAsync: deleteReport } = useDeleteProblemReport();

  // Mark all visible reports as "seen" when tab opens
  useEffect(() => {
    if (reports.length > 0) {
      const ids = reports.map((r) => r.id.toString());
      markAllSeen(ids);
      onReportsRead?.();
    }
  }, [reports, onReportsRead]);

  const handleToggleStatus = async (id: bigint, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "resolved" : "pending";
    try {
      await updateStatus({ id, status: newStatus });
      toast.success(
        `Report marked as ${newStatus === "resolved" ? "Resolved" : "Pending"}.`,
      );
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteReport(id);
      toast.success("Report deleted.");
    } catch {
      toast.error("Failed to delete report.");
    }
  };

  const sortedReports = [...reports].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-1">
            Reported Issues
          </h2>
          <p className="text-sm text-muted-foreground font-body">
            User-submitted problem reports and support requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-body text-sm px-3 py-1">
            {sortedReports.length} total
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 text-xs font-body border-border"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-body text-muted-foreground uppercase tracking-wide">
              Pending
            </span>
          </div>
          <span className="font-display font-bold text-2xl text-amber-400">
            {sortedReports.filter((r) => r.status === "pending").length}
          </span>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-body text-muted-foreground uppercase tracking-wide">
              Resolved
            </span>
          </div>
          <span className="font-display font-bold text-2xl text-emerald-400">
            {sortedReports.filter((r) => r.status === "resolved").length}
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      )}

      {/* Reports List */}
      {!isLoading && sortedReports.length === 0 ? (
        <div
          data-ocid="admin.issues.empty_state"
          className="text-center py-16 border border-dashed border-border rounded-xl"
        >
          <AlertTriangle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            No reported issues yet. Reports will appear here once users submit
            problems.
          </p>
        </div>
      ) : (
        <div data-ocid="admin.issues.table" className="space-y-3">
          {sortedReports.map((report, i) => {
            const createdAt = new Date(Number(report.timestamp) / 1_000_000);
            const isResolved = report.status === "resolved";
            return (
              <motion.div
                key={report.id.toString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                data-ocid={`admin.issues.row.${i + 1}`}
                className={`rounded-xl border bg-card p-5 transition-all duration-200 ${
                  isResolved
                    ? "border-emerald-500/20 bg-emerald-500/3"
                    : "border-border hover:border-primary/20"
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm text-foreground">
                          {report.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-body">
                          {report.email}
                        </p>
                      </div>
                      <Badge
                        className={`text-[10px] font-body ml-1 ${
                          isResolved
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isResolved ? "Resolved" : "Pending"}
                      </Badge>
                    </div>
                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      data-ocid={`admin.issues.delete_button.${i + 1}`}
                      className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                      aria-label="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                        Order ID
                      </span>
                      <span
                        className={
                          report.orderId
                            ? "font-mono font-semibold text-primary text-xs"
                            : "text-muted-foreground text-xs font-body"
                        }
                      >
                        {report.orderId || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                        Submitted
                      </span>
                      <span className="text-muted-foreground text-xs font-body">
                        {createdAt.toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block mb-1">
                      Problem Description
                    </span>
                    <p className="text-sm font-body text-foreground/90 leading-relaxed bg-secondary/30 rounded-lg p-3 border border-border/50">
                      {report.description}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end border-t border-border/50 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleStatus(report.id, report.status)
                      }
                      data-ocid={`admin.issues.resolve.button.${i + 1}`}
                      className={`h-8 text-xs font-body ${
                        !isResolved
                          ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      }`}
                    >
                      {!isResolved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Mark Resolved
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Mark Pending
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
