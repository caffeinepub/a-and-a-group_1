import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ContactSubmission,
  OrderRecord,
  PaymentSettings,
  PortfolioItem,
  ProblemReport,
  Review,
  Service,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Services ──────────────────────────────────────────────────────────────

export function useListServices() {
  const { actor, isFetching } = useActor();
  return useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listServices();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetService(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Service>({
    queryKey: ["service", id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getService(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      icon: string;
      category: string;
      rating: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createService(
        data.title,
        data.description,
        data.icon,
        data.category,
        data.rating,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useUpdateService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      title: string;
      description: string;
      icon: string;
      category: string;
      rating: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateService(
        data.id,
        data.title,
        data.description,
        data.icon,
        data.category,
        data.rating,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteService(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useToggleServiceAvailability() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.toggleServiceAvailability(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
}

// ─── Portfolio ─────────────────────────────────────────────────────────────

export function useListPortfolio() {
  const { actor, isFetching } = useActor();
  return useQuery<PortfolioItem[]>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPortfolioItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFilterPortfolio(category: string) {
  const { actor, isFetching } = useActor();
  return useQuery<PortfolioItem[]>({
    queryKey: ["portfolio", category],
    queryFn: async () => {
      if (!actor) return [];
      if (category === "All") return actor.listPortfolioItems();
      return actor.filterPortfolioByCategory(category);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePortfolio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      category: string;
      description: string;
      blobId: string;
      mediaType: string;
      serviceId: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPortfolio(
        data.title,
        data.category,
        data.description,
        data.blobId,
        data.mediaType,
        data.serviceId,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useDeletePortfolio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePortfolio(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

// ─── Reviews ───────────────────────────────────────────────────────────────

export function useListReviews() {
  const { actor, isFetching } = useActor();
  return useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReviews();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      clientName: string;
      clientProfileBlobId: string | null;
      reviewText: string;
      rating: bigint;
      serviceId: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createReview(
        data.clientName,
        data.clientProfileBlobId,
        data.reviewText,
        data.rating,
        data.serviceId,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useUpdateReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      clientName: string;
      clientProfileBlobId: string | null;
      reviewText: string;
      rating: bigint;
      serviceId: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateReview(
        data.id,
        data.clientName,
        data.clientProfileBlobId,
        data.reviewText,
        data.rating,
        data.serviceId,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useDeleteReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteReview(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

// ─── Contact Submissions ───────────────────────────────────────────────────

export function useSubmitContact() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      projectDetails: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitContact(data.name, data.email, data.projectDetails);
    },
  });
}

export function useListSubmissions() {
  const { actor, isFetching } = useActor();
  return useQuery<ContactSubmission[]>({
    queryKey: ["submissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markAsRead(id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["submissions"] }),
  });
}

export function useDeleteSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteSubmission(id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["submissions"] }),
  });
}

// ─── Problem Reports ───────────────────────────────────────────────────────

export function useSubmitProblemReport() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      orderId: string | null;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitProblemReport(
        data.name,
        data.email,
        data.orderId,
        data.description,
      );
    },
  });
}

export function useListProblemReports() {
  const { actor, isFetching } = useActor();
  return useQuery<ProblemReport[]>({
    queryKey: ["problemReports"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listProblemReports();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateProblemReportStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateProblemReportStatus(data.id, data.status);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["problemReports"] }),
  });
}

export function useDeleteProblemReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteProblemReport(id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["problemReports"] }),
  });
}

// ─── Payment Settings ──────────────────────────────────────────────────────

export function useGetPaymentSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentSettings | null>({
    queryKey: ["paymentSettings"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getPaymentSettings();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePaymentSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      upiId: string;
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      qrCodeBlobId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePaymentSettings(
        data.upiId,
        data.accountHolderName,
        data.accountNumber,
        data.ifscCode,
        data.qrCodeBlobId,
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["paymentSettings"] }),
  });
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Orders ────────────────────────────────────────────────────────────────

export function useSubmitOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      orderId: string;
      name: string;
      email: string;
      whatsappNumber: string;
      service: string;
      projectDetails: string;
      budget: string;
      deadline: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitOrder(
        data.orderId,
        data.name,
        data.email,
        data.whatsappNumber,
        data.service,
        data.projectDetails,
        data.budget,
        data.deadline,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useGetOrderByOrderId(orderId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<OrderRecord | null>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOrderByOrderId(orderId);
    },
    enabled: !!actor && !isFetching && orderId.trim().length > 0,
  });
}

export function useGetOrdersByEmail(email: string) {
  const { actor, isFetching } = useActor();
  return useQuery<OrderRecord[]>({
    queryKey: ["orders", "email", email],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrdersByEmail(email);
    },
    enabled: !!actor && !isFetching && email.trim().length > 0,
  });
}

export function useListAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<OrderRecord[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listAllOrders();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOrderStatus(data.id, data.status);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderPaymentStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; paymentStatus: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOrderPaymentStatus(data.id, data.paymentStatus);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderScreenshot() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: { id: bigint; screenshotBlobId: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOrderScreenshot(data.id, data.screenshotBlobId);
    },
  });
}
