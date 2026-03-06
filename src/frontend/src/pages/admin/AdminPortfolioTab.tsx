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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { PortfolioItem } from "../../backend.d";
import { useBlobStorage } from "../../hooks/useBlobStorage";
import {
  useCreatePortfolio,
  useDeletePortfolio,
  useListPortfolio,
} from "../../hooks/useQueries";

const CATEGORIES = [
  "Video Editing",
  "Thumbnails",
  "Graphic Design",
  "Websites",
  "App UI",
  "Other",
];

interface PortfolioForm {
  title: string;
  category: string;
  description: string;
}

export default function AdminPortfolioTab() {
  const { data: portfolioItems, isLoading } = useListPortfolio();
  const createPortfolio = useCreatePortfolio();
  const deletePortfolio = useDeletePortfolio();
  const { uploadFile, uploadProgress, isUploading } = useBlobStorage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<PortfolioForm>({
    title: "",
    category: "Graphic Design",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleCreate = async () => {
    if (!form.title || !selectedFile) {
      toast.error("Please fill in the title and select a file.");
      return;
    }
    try {
      const blobId = await uploadFile(selectedFile);
      await createPortfolio.mutateAsync({
        title: form.title,
        category: form.category,
        description: form.description,
        blobId,
        mediaType: selectedFile.type,
        serviceId: null,
      });
      toast.success("Portfolio item added!");
      setDialogOpen(false);
      setForm({ title: "", category: "Graphic Design", description: "" });
      setSelectedFile(null);
    } catch {
      toast.error("Upload failed. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePortfolio.mutateAsync(deleteId);
      toast.success("Portfolio item deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">
            Portfolio Management
          </h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Upload and manage your portfolio work
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:shadow-neon-blue-sm"
        >
          <Plus className="w-4 h-4" />
          Upload Work
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          data-ocid="admin.portfolio.loading_state"
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
            <Skeleton key={k} className="aspect-video rounded-xl" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && (!portfolioItems || portfolioItems.length === 0) && (
        <div
          data-ocid="admin.portfolio.empty_state"
          className="text-center py-20 border border-dashed border-border rounded-2xl"
        >
          <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">
            No portfolio items yet.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            className="mt-4 border-primary/30 text-primary hover:bg-primary/10"
            data-ocid="admin.portfolio.upload_button"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload First Item
          </Button>
        </div>
      )}
      {!isLoading && portfolioItems && portfolioItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioItems.map((item: PortfolioItem, i: number) => (
            <div
              key={item.id.toString()}
              className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all"
            >
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-foreground/20" />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-display font-semibold text-foreground truncate">
                    {item.title}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-primary/20 text-primary font-body flex-shrink-0"
                  >
                    {item.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-1">
                  {item.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(item.id)}
                  data-ocid={`admin.portfolio.delete_button.${i + 1}`}
                  className="mt-2 w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              Upload Portfolio Work
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Cinematic Travel Vlog Edit"
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Category</Label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className="w-full bg-secondary border border-border text-foreground rounded-md px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description..."
                rows={2}
                className="bg-secondary border-border text-foreground resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">File *</Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                data-ocid="admin.portfolio.dropzone"
                className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                {selectedFile ? (
                  <div className="text-sm text-foreground font-body">
                    <span className="text-primary">{selectedFile.name}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <span className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-body">
                      Click to select image or video
                    </span>
                  </span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                data-ocid="admin.portfolio.upload_button"
              />
            </div>
            {isUploading && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-body">
                  Uploading... {uploadProgress}%
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-border text-muted-foreground"
              data-ocid="admin.portfolio.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createPortfolio.isPending || isUploading}
              className="bg-primary text-primary-foreground hover:shadow-neon-blue-sm"
              data-ocid="admin.portfolio.save_button"
            >
              {createPortfolio.isPending || isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload
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
              Delete Portfolio Item
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              This will permanently delete the portfolio item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border text-muted-foreground"
              data-ocid="admin.portfolio.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-ocid="admin.portfolio.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
