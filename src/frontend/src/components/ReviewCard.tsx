import { Star } from "lucide-react";
import { motion } from "motion/react";

interface ReviewCardProps {
  clientName: string;
  reviewText: string;
  rating: number;
  service?: string;
  avatarUrl?: string;
  index?: number;
}

export default function ReviewCard({
  clientName,
  reviewText,
  rating,
  service,
  avatarUrl,
  index = 0,
}: ReviewCardProps) {
  const initials = clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate deterministic gradient based on initials
  const gradients = [
    "from-primary/30 to-accent/30",
    "from-accent/30 to-primary/30",
    "from-emerald-500/30 to-primary/30",
    "from-primary/30 to-emerald-500/30",
    "from-amber-500/30 to-primary/30",
    "from-primary/30 to-amber-500/30",
  ];
  const gradientClass = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.1, 0.5) }}
      className="group relative"
    >
      <div className="h-full rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary/30 hover:shadow-neon-blue-sm transition-all duration-300 hover:-translate-y-1">
        {/* Quote mark */}
        <div className="text-4xl leading-none font-display text-primary/20 group-hover:text-primary/40 transition-colors -mt-1 -mb-2 select-none">
          "
        </div>

        {/* Review text */}
        <p className="text-sm text-muted-foreground font-body leading-relaxed">
          {reviewText}
        </p>

        {/* Stars */}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= Math.round(rating)
                  ? "text-amber-400 fill-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Client info */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={clientName}
              className="w-10 h-10 rounded-full object-cover border border-border"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${gradientClass} border border-border/50 text-xs font-display font-bold text-foreground`}
            >
              {initials}
            </div>
          )}
          <div>
            <div className="text-sm font-display font-semibold text-foreground">
              {clientName}
            </div>
            {service && (
              <div className="text-xs text-primary/70 font-body">{service}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
