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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Review } from "../../backend.d";
import { DEFAULT_REVIEWS } from "../../data/services";
import {
  useCreateReview,
  useDeleteReview,
  useListReviews,
  useUpdateReview,
} from "../../hooks/useQueries";

interface ReviewForm {
  clientName: string;
  reviewText: string;
  rating: string;
}

const EMPTY_FORM: ReviewForm = { clientName: "", reviewText: "", rating: "5" };

export default function AdminReviewsTab() {
  const { data: backendReviews, isLoading } = useListReviews();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<ReviewForm>(EMPTY_FORM);

  const reviews =
    backendReviews && backendReviews.length > 0
      ? backendReviews
      : DEFAULT_REVIEWS.map(
          (r) =>
            ({
              id: BigInt(r.id),
              clientName: r.clientName,
              reviewText: r.reviewText,
              rating: BigInt(r.rating),
              createdAt: BigInt(0),
              clientProfileBlobId: undefined as string | undefined,
              serviceId: undefined as bigint | undefined,
            }) as Review,
        );

  const openAdd = () => {
    setEditingReview(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (r: Review) => {
    setEditingReview(r);
    setForm({
      clientName: r.clientName,
      reviewText: r.reviewText,
      rating: String(r.rating),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.clientName || !form.reviewText) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      if (editingReview) {
        await updateReview.mutateAsync({
          id: editingReview.id,
          clientName: form.clientName,
          clientProfileBlobId: null,
          reviewText: form.reviewText,
          rating: BigInt(Number.parseInt(form.rating)),
          serviceId: null,
        });
        toast.success("Review updated!");
      } else {
        await createReview.mutateAsync({
          clientName: form.clientName,
          clientProfileBlobId: null,
          reviewText: form.reviewText,
          rating: BigInt(Number.parseInt(form.rating)),
          serviceId: null,
        });
        toast.success("Review added!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save review.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteReview.mutateAsync(deleteId);
      toast.success("Review deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">
            Reviews Management
          </h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {reviews.length} reviews total
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:shadow-neon-blue-sm"
        >
          <Plus className="w-4 h-4" />
          Add Review
        </Button>
      </div>

      {isLoading && (
        <div data-ocid="admin.reviews.loading_state" className="space-y-3">
          {["rv1", "rv2", "rv3", "rv4"].map((k) => (
            <Skeleton key={k} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {reviews.length === 0 && (
            <div
              data-ocid="admin.reviews.empty_state"
              className="text-center py-12 border border-dashed border-border rounded-xl"
            >
              <p className="text-muted-foreground font-body text-sm">
                No reviews yet.
              </p>
            </div>
          )}
          {reviews.map((r, i) => (
            <div
              key={r.id.toString()}
              className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 flex-shrink-0 text-xs font-display font-bold text-primary">
                {r.clientName.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display font-semibold text-sm text-foreground">
                    {r.clientName}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= Number(r.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-body line-clamp-2">
                  {r.reviewText}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(r)}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(r.id)}
                  data-ocid={`admin.reviews.delete_button.${i + 1}`}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {editingReview ? "Edit Review" : "Add Review"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Client Name *
              </Label>
              <Input
                value={form.clientName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clientName: e.target.value }))
                }
                placeholder="e.g. Rahul S"
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Review Text *
              </Label>
              <Textarea
                value={form.reviewText}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reviewText: e.target.value }))
                }
                placeholder="Client's review..."
                rows={3}
                className="bg-secondary border-border text-foreground resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Rating (1–5)
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, rating: String(s) }))
                    }
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        s <= Number.parseInt(form.rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-border text-muted-foreground"
              data-ocid="admin.reviews.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createReview.isPending || updateReview.isPending}
              className="bg-primary text-primary-foreground"
              data-ocid="admin.reviews.save_button"
            >
              {(createReview.isPending || updateReview.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {editingReview ? "Update" : "Add"} Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Review
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border"
              data-ocid="admin.reviews.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="admin.reviews.confirm_button"
            >
              {deleteReview.isPending && (
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
