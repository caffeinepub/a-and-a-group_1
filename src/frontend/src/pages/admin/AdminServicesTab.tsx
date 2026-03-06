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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Service } from "../../backend.d";
import ServiceIcon from "../../components/ServiceIcon";
import { DEFAULT_SERVICES } from "../../data/services";
import {
  useCreateService,
  useDeleteService,
  useListServices,
  useToggleServiceAvailability,
  useUpdateService,
} from "../../hooks/useQueries";

interface ServiceForm {
  title: string;
  description: string;
  icon: string;
  category: string;
  rating: string;
}

const EMPTY_FORM: ServiceForm = {
  title: "",
  description: "",
  icon: "zap",
  category: "Design",
  rating: "4.8",
};

export default function AdminServicesTab() {
  const { data: backendServices, isLoading } = useListServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const toggleAvailability = useToggleServiceAvailability();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

  const services =
    backendServices && backendServices.length > 0
      ? backendServices
      : DEFAULT_SERVICES.map(
          (s) =>
            ({
              id: BigInt(s.id),
              title: s.title,
              icon: s.icon,
              description: s.description,
              category: s.category,
              rating: s.rating,
              isAvailable: s.isAvailable,
            }) as Service,
        );

  const openAdd = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditingService(svc);
    setForm({
      title: svc.title,
      description: svc.description,
      icon: svc.icon,
      category: svc.category,
      rating: String(svc.rating),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const rating = Number.parseFloat(form.rating) || 4.8;
    try {
      if (editingService) {
        await updateService.mutateAsync({
          id: editingService.id,
          title: form.title,
          description: form.description,
          icon: form.icon,
          category: form.category,
          rating,
        });
        toast.success("Service updated successfully!");
      } else {
        await createService.mutateAsync({
          title: form.title,
          description: form.description,
          icon: form.icon,
          category: form.category,
          rating,
        });
        toast.success("Service created successfully!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save service. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteService.mutateAsync(deleteId);
      toast.success("Service deleted.");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete service.");
    }
  };

  const handleToggle = async (id: bigint) => {
    try {
      await toggleAvailability.mutateAsync(id);
      toast.success("Service availability updated.");
    } catch {
      toast.error("Failed to update availability.");
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">
            Services Management
          </h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {services.length} services total
          </p>
        </div>
        <Button
          onClick={openAdd}
          data-ocid="admin.add_service.primary_button"
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:shadow-neon-blue-sm"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div data-ocid="admin.services.loading_state" className="space-y-3">
          {["sv1", "sv2", "sv3", "sv4", "sv5"].map((k) => (
            <Skeleton key={k} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {/* Services list */}
      {!isLoading && (
        <div className="space-y-3">
          {services.map((svc, i) => (
            <div
              key={svc.id.toString()}
              data-ocid={`admin.service.row.${i + 1}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 flex-shrink-0">
                <ServiceIcon name={svc.icon} className="w-4 h-4 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-semibold text-sm text-foreground">
                    {svc.title}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-primary/20 text-primary font-body"
                  >
                    {svc.category}
                  </Badge>
                  <Badge
                    className={`text-[10px] font-body ${
                      svc.isAvailable
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {svc.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-body truncate mt-0.5">
                  {svc.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-body hidden sm:block">
                    {svc.isAvailable ? "On" : "Off"}
                  </span>
                  <Switch
                    checked={svc.isAvailable}
                    onCheckedChange={() => handleToggle(svc.id)}
                    data-ocid={`service.toggle.${i + 1}`}
                    disabled={toggleAvailability.isPending}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(svc)}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
                  aria-label="Edit service"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(svc.id)}
                  data-ocid={`admin.service.delete_button.${i + 1}`}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  aria-label="Delete service"
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
        <DialogContent className="glass border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {editingService ? "Edit Service" : "Add New Service"}
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
                placeholder="e.g. Video Editing"
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Description *
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description of the service..."
                rows={3}
                className="bg-secondary border-border text-foreground resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Icon Name
                </Label>
                <Input
                  value={form.icon}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, icon: e.target.value }))
                  }
                  placeholder="e.g. film"
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Category
                </Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  placeholder="e.g. Design"
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Rating (1–5)
              </Label>
              <Input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(e) =>
                  setForm((p) => ({ ...p, rating: e.target.value }))
                }
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="admin.service.cancel_button"
              className="border-border text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              data-ocid="admin.service.save_button"
              disabled={createService.isPending || updateService.isPending}
              className="bg-primary text-primary-foreground hover:shadow-neon-blue-sm"
            >
              {createService.isPending || updateService.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingService ? "Update Service" : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Service
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              Are you sure you want to delete this service? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.service.cancel_button"
              className="border-border text-muted-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="admin.service.confirm_button"
              className="bg-destructive text-destructive-foreground"
            >
              {deleteService.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
