import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import FloatingWidgets from "./components/FloatingWidgets";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import UserIdentityModal from "./components/UserIdentityModal";
import AdminPage from "./pages/AdminPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import PortfolioPage from "./pages/PortfolioPage";
import ReviewsPage from "./pages/ReviewsPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ServicesPage from "./pages/ServicesPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import { getCurrentUser } from "./utils/localData";

// ─── Root Layout ─────────────────────────────────────────────────────────

function RootLayout() {
  const [identityComplete, setIdentityComplete] = useState(
    () => getCurrentUser() !== null,
  );

  return (
    <div className="min-h-screen flex flex-col">
      {!identityComplete && (
        <UserIdentityModal onComplete={() => setIdentityComplete(true)} />
      )}
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <FloatingWidgets />
      <Toaster position="bottom-center" />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

// ─── Routes ──────────────────────────────────────────────────────────────

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services",
  component: ServicesPage,
});

const serviceDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/$id",
  component: ServiceDetailPage,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portfolio",
  component: PortfolioPage,
});

const reviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reviews",
  component: ReviewsPage,
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const trackOrderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/track-order",
  component: TrackOrderPage,
});

// ─── Router ──────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  homeRoute,
  servicesRoute,
  serviceDetailRoute,
  portfolioRoute,
  reviewsRoute,
  contactRoute,
  adminRoute,
  trackOrderRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
