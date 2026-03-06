import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, MessageCircle, Star } from "lucide-react";
import { motion } from "motion/react";
import type { Review } from "../backend.d";
import ReviewCard from "../components/ReviewCard";
import ServiceIcon from "../components/ServiceIcon";
import { DEFAULT_REVIEWS, DEFAULT_SERVICES } from "../data/services";
import { useGetService } from "../hooks/useQueries";
import { useListReviews } from "../hooks/useQueries";

export default function ServiceDetailPage() {
  const { id } = useParams({ from: "/services/$id" });
  const numericId = BigInt(id || "0");

  const { data: backendService, isLoading: serviceLoading } =
    useGetService(numericId);
  const { data: backendReviews } = useListReviews();

  // Use backend or default service
  const service = backendService
    ? {
        id: backendService.id.toString(),
        title: backendService.title,
        icon: backendService.icon,
        description: backendService.description,
        category: backendService.category,
        rating: backendService.rating,
        isAvailable: backendService.isAvailable,
        longDescription: backendService.description,
      }
    : DEFAULT_SERVICES.find((s) => String(s.id) === id) || DEFAULT_SERVICES[0];

  const reviews: Array<{
    clientName: string;
    reviewText: string;
    rating: number;
    service?: string;
  }> =
    backendReviews && backendReviews.length > 0
      ? backendReviews
          .filter((r: Review) => r.serviceId?.toString() === id)
          .map((r: Review) => ({
            clientName: r.clientName,
            reviewText: r.reviewText,
            rating: Number(r.rating),
            service: undefined as string | undefined,
          }))
      : DEFAULT_REVIEWS.slice(0, 3).map((r) => ({
          clientName: r.clientName,
          reviewText: r.reviewText,
          rating: r.rating,
          service: r.service as string | undefined,
        }));

  if (serviceLoading) {
    return (
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
            <div className="h-8 bg-secondary rounded w-1/4" />
            <div className="h-48 bg-secondary rounded-xl" />
            <div className="h-32 bg-secondary rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-2xl text-foreground">
            Service not found
          </h1>
          <Link to="/services" className="text-primary mt-4 inline-block">
            ← Back to Services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-24">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground font-body mb-8"
        >
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/services" className="hover:text-primary transition-colors">
            Services
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">{service.title}</span>
        </motion.div>

        {/* Back button */}
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-2xl border border-border bg-card p-8 lg:p-12 mb-8 overflow-hidden"
        >
          {/* BG gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/30 flex-shrink-0 animate-pulse-glow">
              <ServiceIcon
                name={service.icon}
                className="w-9 h-9 text-primary"
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-3 mb-3">
                <h1 className="font-display font-bold text-3xl lg:text-4xl text-foreground">
                  {service.title}
                </h1>
                <Badge
                  className={`mt-1 ${
                    service.isAvailable
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {service.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(service.rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-display font-bold text-xl text-foreground">
                  {service.rating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground font-body">
                  / 5 stars
                </span>
              </div>

              <p className="text-muted-foreground font-body leading-relaxed text-base">
                {service.description}
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary font-body"
                >
                  {service.category}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Long Description */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-8 mb-8"
        >
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            About This Service
          </h2>
          <p className="text-muted-foreground font-body leading-relaxed">
            {service.longDescription || service.description}
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-8 mb-12"
        >
          <h2 className="font-display font-bold text-xl text-foreground mb-2">
            Interested in this service?
          </h2>
          <p className="text-muted-foreground font-body text-sm mb-6">
            Get in touch and we'll create a custom plan for your project.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://wa.me/917380869635?text=Hi+A+AND+A+GROUP%2C+I'm+interested+in+your+${encodeURIComponent(service.title)}+service.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-display font-bold text-sm hover:shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-105 transition-all duration-300"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/30 bg-primary/5 text-primary font-display font-semibold text-sm hover:bg-primary/10 transition-all duration-300"
            >
              Send a Message
            </Link>
          </div>
        </motion.div>

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display font-bold text-2xl text-foreground mb-6">
            Client Reviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <ReviewCard
                key={r.clientName}
                clientName={r.clientName}
                reviewText={r.reviewText}
                rating={r.rating}
                service={r.service}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
