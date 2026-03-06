import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ContactSubmission {
    id: bigint;
    name: string;
    createdAt: bigint;
    isRead: boolean;
    email: string;
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
    rating: number;
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
    createService(title: string, description: string, icon: string, category: string, rating: number): Promise<bigint>;
    deletePortfolio(id: bigint): Promise<void>;
    deleteReview(id: bigint): Promise<void>;
    deleteService(id: bigint): Promise<void>;
    deleteSubmission(id: bigint): Promise<void>;
    filterPortfolioByCategory(category: string): Promise<Array<PortfolioItem>>;
    getCallerUserRole(): Promise<UserRole>;
    getService(id: bigint): Promise<Service>;
    isCallerAdmin(): Promise<boolean>;
    listPortfolioItems(): Promise<Array<PortfolioItem>>;
    listReviews(): Promise<Array<Review>>;
    listServices(): Promise<Array<Service>>;
    listSubmissions(): Promise<Array<ContactSubmission>>;
    markAsRead(id: bigint): Promise<void>;
    submitContact(name: string, email: string, projectDetails: string): Promise<bigint>;
    toggleServiceAvailability(id: bigint): Promise<void>;
    updatePortfolio(id: bigint, title: string, category: string, description: string, blobId: string, mediaType: string, serviceId: bigint | null): Promise<void>;
    updateReview(id: bigint, clientName: string, clientProfileBlobId: string | null, reviewText: string, rating: bigint, serviceId: bigint | null): Promise<void>;
    updateService(id: bigint, title: string, description: string, icon: string, category: string, rating: number): Promise<void>;
}
