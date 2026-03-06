import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Star } from "lucide-react";
import { motion } from "motion/react";
import ServiceIcon from "./ServiceIcon";

interface ServiceCardProps {
  id: string | number;
  title: string;
  icon: string;
  description: string;
  rating: number;
  isAvailable: boolean;
  index?: number;
  "data-ocid"?: string;
}

export default function ServiceCard({
  id,
  title,
  icon,
  description,
  rating,
  isAvailable,
  index = 0,
  "data-ocid": dataOcid,
}: ServiceCardProps) {
  return (
    <motion.div
      data-ocid={dataOcid}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4) }}
      className="group relative"
    >
      <div
        className="relative h-full flex flex-col rounded-xl border border-border bg-card p-6 overflow-hidden
          transition-all duration-300 cursor-pointer
          hover:border-primary/40 hover:shadow-neon-blue-sm hover:-translate-y-1"
      >
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

        {/* Top row: icon + availability */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center
              bg-primary/10 border border-primary/20 group-hover:border-primary/50
              group-hover:bg-primary/20 transition-all duration-300"
          >
            <ServiceIcon
              name={icon}
              className="w-5 h-5 text-primary transition-all duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-neon-blue-sm" />
          </div>
          <Badge
            variant={isAvailable ? "default" : "secondary"}
            className={`text-[10px] font-body font-semibold tracking-wide ${
              isAvailable
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {isAvailable ? "Available" : "Unavailable"}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-base text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground font-body leading-relaxed flex-1 mb-4 line-clamp-3">
          {description}
        </p>

        {/* Rating + View Details */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-body">
              {rating.toFixed(1)}
            </span>
          </div>

          <Link
            to="/services/$id"
            params={{ id: String(id) }}
            data-ocid={`service.view_details.button.${index + 1}`}
            className="flex items-center gap-1 text-xs font-display font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View Details
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
