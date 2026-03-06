import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useListProblemReports } from "../../hooks/useQueries";
import {
  type ProblemReport,
  deleteReport,
  getReports,
  markReportRead,
  updateReportStatus,
} from "../../utils/localData";

export default function AdminReportedIssuesTab({
  onReportsRead,
}: {
  onReportsRead?: () => void;
}) {
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const { data: backendReports } = useListProblemReports();

  useEffect(() => {
    loadReports();
  }, []);

  // Merge backend reports with local reports when backend data arrives
  useEffect(() => {
    if (backendReports && backendReports.length > 0) {
      const local = getReports();
      const localIds = new Set(local.map((r) => r.id));
      const merged = [...local];
      // Add backend reports that aren't in local storage
      for (const br of backendReports) {
        const bId = br.id.toString();
        if (!localIds.has(bId)) {
          merged.push({
            id: bId,
            name: br.name,
            email: br.email,
            orderId: br.orderId,
            description: br.description,
            status: (br.status as "pending" | "resolved") || "pending",
            createdAt: new Date(Number(br.timestamp) / 1_000_000).toISOString(),
            isRead: false,
          });
        }
      }
      const sorted = [...merged].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setReports(sorted);
      // Mark all unread reports as read
      markAllAsRead(sorted);
    }
  }, [backendReports]);

  const markAllAsRead = (reportList: ProblemReport[]) => {
    for (const r of reportList) {
      if (!r.isRead) {
        markReportRead(r.id);
      }
    }
    onReportsRead?.();
  };

  const loadReports = () => {
    const local = getReports();
    const sorted = [...local].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setReports(sorted);
    // Mark all as read when tab is opened
    markAllAsRead(sorted);
  };

  const handleToggleStatus = (report: ProblemReport) => {
    const newStatus = report.status === "pending" ? "resolved" : "pending";
    updateReportStatus(report.id, newStatus);
    loadReports();
    toast.success(
      `Report marked as ${newStatus === "resolved" ? "Resolved" : "Pending"}.`,
    );
  };

  const handleDelete = (report: ProblemReport) => {
    deleteReport(report.id);
    loadReports();
    toast.success("Report deleted.");
  };

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
        <Badge className="bg-primary/10 text-primary border border-primary/20 font-body text-sm px-3 py-1">
          {reports.length} total
        </Badge>
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
            {reports.filter((r) => r.status === "pending").length}
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
            {reports.filter((r) => r.status === "resolved").length}
          </span>
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
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
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              data-ocid={`admin.issues.row.${i + 1}`}
              className={`rounded-xl border bg-card p-5 transition-all duration-200 ${
                report.status === "resolved"
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
                        report.status === "resolved"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {report.status === "resolved" ? "Resolved" : "Pending"}
                    </Badge>
                  </div>
                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(report)}
                    data-ocid={`admin.issues.delete_button.${i + 1}`}
                    className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                    aria-label="Delete report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {report.orderId && (
                    <div>
                      <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                        Order ID
                      </span>
                      <span className="font-mono font-semibold text-primary text-xs">
                        {report.orderId}
                      </span>
                    </div>
                  )}
                  {!report.orderId && (
                    <div>
                      <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                        Order ID
                      </span>
                      <span className="text-muted-foreground text-xs font-body">
                        —
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-body uppercase tracking-wide text-muted-foreground/60 block">
                      Submitted
                    </span>
                    <span className="text-muted-foreground text-xs font-body">
                      {new Date(report.createdAt).toLocaleString("en-IN", {
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
                    onClick={() => handleToggleStatus(report)}
                    data-ocid={`admin.issues.resolve.button.${i + 1}`}
                    className={`h-8 text-xs font-body ${
                      report.status === "pending"
                        ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    }`}
                  >
                    {report.status === "pending" ? (
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
          ))}
        </div>
      )}
    </div>
  );
}
