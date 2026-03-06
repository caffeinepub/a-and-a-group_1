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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Loader2, Mail, MailOpen, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ContactSubmission } from "../../backend.d";
import {
  useDeleteSubmission,
  useListSubmissions,
  useMarkAsRead,
} from "../../hooks/useQueries";

export default function AdminSubmissionsTab() {
  const { data: submissions, isLoading } = useListSubmissions();
  const markAsRead = useMarkAsRead();
  const deleteSubmission = useDeleteSubmission();
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const handleMarkRead = async (id: bigint) => {
    try {
      await markAsRead.mutateAsync(id);
      toast.success("Marked as read.");
    } catch {
      toast.error("Failed to update.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSubmission.mutateAsync(deleteId);
      toast.success("Submission deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const formatDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    if (ms === 0) return "–";
    return new Date(ms).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">
            Contact Submissions
          </h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {submissions?.length ?? 0} submissions total
          </p>
        </div>
      </div>

      {isLoading && (
        <div data-ocid="admin.submissions.loading_state" className="space-y-3">
          {["sm1", "sm2", "sm3", "sm4", "sm5"].map((k) => (
            <Skeleton key={k} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!submissions || submissions.length === 0) && (
        <div
          data-ocid="admin.submissions.empty_state"
          className="text-center py-16 border border-dashed border-border rounded-xl"
        >
          <Mail className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">
            No contact submissions yet.
          </p>
        </div>
      )}
      {!isLoading && submissions && submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map((sub: ContactSubmission, i: number) => (
            <div
              key={sub.id.toString()}
              data-ocid={`admin.submissions.row.${i + 1}`}
              className={`p-5 rounded-xl border bg-card transition-all ${
                sub.isRead ? "border-border" : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-display font-semibold text-sm text-foreground">
                      {sub.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-body">
                      {sub.email}
                    </span>
                    <Badge
                      className={`text-[10px] font-body ${
                        sub.isRead
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {sub.isRead ? "Read" : "New"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-body ml-auto">
                      {formatDate(sub.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body leading-relaxed line-clamp-3">
                    {sub.projectDetails}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!sub.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkRead(sub.id)}
                      disabled={markAsRead.isPending}
                      className="text-primary hover:bg-primary/10 h-8 w-8"
                      aria-label="Mark as read"
                    >
                      {markAsRead.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MailOpen className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(sub.id)}
                    data-ocid={`admin.submissions.delete_button.${i + 1}`}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Reply buttons */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                <a
                  href={`https://wa.me/917380869635?text=Hi+${encodeURIComponent(sub.name)}%2C+thank+you+for+contacting+A+AND+A+GROUP.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#25D366] hover:underline font-body"
                >
                  Reply on WhatsApp
                </a>
                <span className="text-muted-foreground/30">·</span>
                <a
                  href={`mailto:${sub.email}?subject=Re: Your inquiry to A AND A GROUP`}
                  className="text-xs text-primary hover:underline font-body"
                >
                  Reply by Email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Submission
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              This will permanently delete this contact submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border"
              data-ocid="admin.submissions.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="admin.submissions.confirm_button"
            >
              {deleteSubmission.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
