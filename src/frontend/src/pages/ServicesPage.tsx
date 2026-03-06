import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Service } from "../backend.d";
import ServiceCard from "../components/ServiceCard";
import { DEFAULT_SERVICES } from "../data/services";
import { useListServices } from "../hooks/useQueries";

const categories = [
  "All",
  "Video",
  "Design",
  "Development",
  "Social Media",
  "Marketing",
  "AI",
];

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { data: backendServices } = useListServices();

  const rawServices =
    backendServices && backendServices.length > 0
      ? backendServices.map((s: Service) => ({
          id: s.id.toString(),
          title: s.title,
          icon: s.icon,
          description: s.description,
          category: s.category,
          rating: Number(s.rating),
          isAvailable: s.isAvailable,
        }))
      : DEFAULT_SERVICES.map((s) => ({
          id: String(s.id),
          title: s.title,
          icon: s.icon,
          description: s.description,
          category: s.category,
          rating: s.rating,
          isAvailable: s.isAvailable,
        }));

  const filtered = rawServices.filter((s) => {
    const matchesCategory =
      activeCategory === "All" || s.category === activeCategory;
    const matchesSearch =
      search === "" ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="pt-24 pb-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-body font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Professional Digital Services
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-bold text-4xl lg:text-6xl text-foreground mb-4"
          >
            All <span className="gradient-text">Services</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-body max-w-xl mx-auto"
          >
            18 professional services tailored to elevate your brand and drive
            digital growth.
          </motion.p>
        </div>

        {/* Search + Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row gap-4 mb-12 max-w-3xl mx-auto"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                data-ocid="portfolio.filter.tab"
                className={`px-4 py-2 rounded-lg text-xs font-body font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-neon-blue-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Services Grid */}
        {filtered.length === 0 ? (
          <div data-ocid="services.empty_state" className="text-center py-20">
            <p className="text-muted-foreground font-body">
              No services found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((service, i) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                icon={service.icon}
                description={service.description}
                rating={service.rating}
                isAvailable={service.isAvailable}
                index={i}
                data-ocid={`service.item.${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
