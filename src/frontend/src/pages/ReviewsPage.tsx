import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Star } from "lucide-react";
import { motion } from "motion/react";
import type { Review } from "../backend.d";
import ReviewCard from "../components/ReviewCard";
import { DEFAULT_REVIEWS } from "../data/services";
import { useListReviews } from "../hooks/useQueries";

export default function ReviewsPage() {
  const { data: backendReviews, isLoading } = useListReviews();

  const reviews =
    backendReviews && backendReviews.length > 0
      ? backendReviews.map((r: Review) => ({
          id: r.id.toString(),
          clientName: r.clientName,
          reviewText: r.reviewText,
          rating: Number(r.rating),
          service: undefined as string | undefined,
        }))
      : DEFAULT_REVIEWS.map((r) => ({
          id: String(r.id),
          clientName: r.clientName,
          reviewText: r.reviewText,
          rating: r.rating,
          service: r.service,
        }));

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 5;

  return (
    <main className="pt-24 pb-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-body font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Client Testimonials
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-bold text-4xl lg:text-6xl text-foreground mb-4"
          >
            Client <span className="gradient-text">Reviews</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-body max-w-xl mx-auto mb-8"
          >
            Real feedback from real clients who trusted us with their digital
            projects.
          </motion.p>

          {/* Summary stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl border border-border bg-card"
          >
            <div className="text-center">
              <div className="font-display font-bold text-3xl text-foreground">
                {avgRating.toFixed(1)}
              </div>
              <div className="flex justify-center mt-1 gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(avgRating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground font-body mt-0.5">
                Average Rating
              </div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="font-display font-bold text-3xl text-foreground">
                {reviews.length}
              </div>
              <div className="text-xs text-muted-foreground font-body mt-1">
                Total Reviews
              </div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="font-display font-bold text-3xl text-foreground">
                {reviews.filter((r) => r.rating === 5).length}
              </div>
              <div className="text-xs text-muted-foreground font-body mt-1">
                5-Star Reviews
              </div>
            </div>
          </motion.div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            data-ocid="reviews.loading_state"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {["r1", "r2", "r3", "r4", "r5", "r6"].map((k) => (
              <div
                key={k}
                className="rounded-xl border border-border p-6 space-y-3"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-20" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Reviews grid */}
        {!isLoading && reviews.length === 0 && (
          <div data-ocid="reviews.empty_state" className="text-center py-20">
            <p className="text-muted-foreground font-body">No reviews yet.</p>
          </div>
        )}
        {!isLoading && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <ReviewCard
                key={r.id}
                clientName={r.clientName}
                reviewText={r.reviewText}
                rating={r.rating}
                service={r.service}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
