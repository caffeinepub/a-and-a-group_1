import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PaymentSettings {
    ifscCode: string;
    accountHolderName: string;
    upiId: string;
    accountNumber: string;
    qrCodeBlobId: string;
}
export interface ProblemReport {
    id: bigint;
    status: string;
    name: string;
    description: string;
    email: string;
    orderId?: string;
    timestamp: bigint;
}
export interface OrderRecord {
    id: bigint;
    service: string;
    status: string;
    paymentStatus: string;
    screenshotBlobId?: string;
    name: string;
    createdAt: bigint;
    deadline: string;
    email: string;
    orderId: string;
    whatsappNumber: string;
    budget: string;
    projectDetails: string;
}
export interface PortfolioItem {
    id: bigint;
    title: string;
    description: string;
    blobId: string;
    mediaType: string;
    category: string;
    serviceId?: bigint;
}
export interface Service {
    id: bigint;
    title: string;
    icon: string;
    isAvailable: boolean;
    description: string;
    category: string;
    rating: bigint;
}
export interface ContactSubmission {
    id: bigint;
    name: string;
    createdAt: bigint;
    isRead: boolean;
    email: string;
    projectDetails: string;
}
export interface UserProfile {
    name: string;
}
export interface Review {
    id: bigint;
    clientName: string;
    createdAt: bigint;
    reviewText: string;
    clientProfileBlobId?: string;
    rating: bigint;
    serviceId?: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPortfolio(title: string, category: string, description: string, blobId: string, mediaType: string, serviceId: bigint | null): Promise<bigint>;
    createReview(clientName: string, clientProfileBlobId: string | null, reviewText: string, rating: bigint, serviceId: bigint | null): Promise<bigint>;
    createService(title: string, description: string, icon: string, category: string, rating: bigint): Promise<bigint>;
    deletePortfolio(id: bigint): Promise<void>;
    deleteProblemReport(id: bigint): Promise<void>;
    deleteReview(id: bigint): Promise<void>;
    deleteService(id: bigint): Promise<void>;
    deleteSubmission(id: bigint): Promise<void>;
    filterPortfolioByCategory(category: string): Promise<Array<PortfolioItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrderByOrderId(orderId: string): Promise<OrderRecord | null>;
    getOrdersByEmail(email: string): Promise<Array<OrderRecord>>;
    getPaymentSettings(): Promise<PaymentSettings | null>;
    getService(id: bigint): Promise<Service>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllOrders(): Promise<Array<OrderRecord>>;
    listPortfolioItems(): Promise<Array<PortfolioItem>>;
    listProblemReports(): Promise<Array<ProblemReport>>;
    listReviews(): Promise<Array<Review>>;
    listServices(): Promise<Array<Service>>;
    listSubmissions(): Promise<Array<ContactSubmission>>;
    markAsRead(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitContact(name: string, email: string, projectDetails: string): Promise<bigint>;
    submitOrder(orderId: string, name: string, email: string, whatsappNumber: string, service: string, projectDetails: string, budget: string, deadline: string): Promise<bigint>;
    submitProblemReport(name: string, email: string, orderId: string | null, description: string): Promise<bigint>;
    toggleServiceAvailability(id: bigint): Promise<void>;
    updateOrderPaymentStatus(id: bigint, paymentStatus: string): Promise<void>;
    updateOrderScreenshot(id: bigint, screenshotBlobId: string): Promise<void>;
    updateOrderStatus(id: bigint, status: string): Promise<void>;
    updatePaymentSettings(upiId: string, accountHolderName: string, accountNumber: string, ifscCode: string, qrCodeBlobId: string): Promise<void>;
    updatePortfolio(id: bigint, title: string, category: string, description: string, blobId: string, mediaType: string, serviceId: bigint | null): Promise<void>;
    updateProblemReportStatus(id: bigint, status: string): Promise<void>;
    updateReview(id: bigint, clientName: string, clientProfileBlobId: string | null, reviewText: string, rating: bigint, serviceId: bigint | null): Promise<void>;
    updateService(id: bigint, title: string, description: string, icon: string, category: string, rating: bigint): Promise<void>;
}
