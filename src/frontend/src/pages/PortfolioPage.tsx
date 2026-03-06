import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid3X3, Image as ImageIcon, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { PortfolioItem } from "../backend.d";
import { useBlobStorage } from "../hooks/useBlobStorage";
import { useListPortfolio } from "../hooks/useQueries";

const CATEGORIES = [
  "All",
  "Video Editing",
  "Thumbnails",
  "Graphic Design",
  "Websites",
  "App UI",
];

// Sample portfolio items to display if nothing loaded yet
const SAMPLE_PORTFOLIO = [
  {
    id: "1",
    title: "Cinematic Travel Vlog Edit",
    category: "Video Editing",
    description:
      "High-paced cinematic travel video with color grading and music sync.",
    gradient: "from-blue-600/30 to-purple-600/30",
  },
  {
    id: "2",
    title: "YouTube Thumbnail Series",
    category: "Thumbnails",
    description:
      "Bold, high-CTR thumbnails for a gaming channel with 200K subscribers.",
    gradient: "from-orange-500/30 to-red-500/30",
  },
  {
    id: "3",
    title: "Brand Identity System",
    category: "Graphic Design",
    description:
      "Complete visual identity for a fintech startup including logo, colors, and typography.",
    gradient: "from-emerald-500/30 to-teal-500/30",
  },
  {
    id: "4",
    title: "E-Commerce Website",
    category: "Websites",
    description:
      "Modern, conversion-focused e-commerce design for a fashion brand.",
    gradient: "from-pink-500/30 to-purple-500/30",
  },
  {
    id: "5",
    title: "Finance App UI",
    category: "App UI",
    description:
      "Clean, data-driven dashboard design for a personal finance iOS app.",
    gradient: "from-cyan-500/30 to-blue-500/30",
  },
  {
    id: "6",
    title: "Instagram Reel Pack",
    category: "Video Editing",
    description:
      "Trending-style Reels with text animations and beat sync for a lifestyle brand.",
    gradient: "from-yellow-500/30 to-orange-500/30",
  },
];

function PortfolioCard({
  item,
  index,
  imageUrl,
}: {
  item: {
    id: string;
    title: string;
    category: string;
    description: string;
    gradient?: string;
    blobId?: string;
  };
  index: number;
  imageUrl?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
      className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-neon-blue-sm transition-all duration-300 hover:-translate-y-1 bg-card"
    >
      {/* Preview area */}
      <div
        className={`aspect-video bg-gradient-to-br ${item.gradient ?? "from-primary/20 to-accent/20"} flex items-center justify-center relative overflow-hidden`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-foreground/30">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs font-body">Portfolio Work</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <Badge
            variant="outline"
            className="text-[10px] flex-shrink-0 border-primary/20 text-primary font-body"
          >
            {item.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground font-body line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}

function PortfolioCardWithImage({
  item,
  index,
}: { item: PortfolioItem; index: number }) {
  const { getFileUrl } = useBlobStorage();
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  if (!loaded && item.blobId) {
    setLoaded(true);
    getFileUrl(item.blobId)
      .then(setImageUrl)
      .catch(() => {});
  }

  return (
    <PortfolioCard
      item={{
        id: item.id.toString(),
        title: item.title,
        category: item.category,
        description: item.description,
        gradient: "from-primary/20 to-accent/20",
        blobId: item.blobId,
      }}
      index={index}
      imageUrl={imageUrl}
    />
  );
}

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: portfolioItems, isLoading } = useListPortfolio();

  const hasBackendItems = portfolioItems && portfolioItems.length > 0;

  const filteredSamples =
    activeCategory === "All"
      ? SAMPLE_PORTFOLIO
      : SAMPLE_PORTFOLIO.filter((i) => i.category === activeCategory);

  const filteredBackend =
    portfolioItems && activeCategory === "All"
      ? portfolioItems
      : (portfolioItems?.filter(
          (i: PortfolioItem) => i.category === activeCategory,
        ) ?? []);

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
            <Grid3X3 className="w-3.5 h-3.5" />
            Our Work
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-bold text-4xl lg:text-6xl text-foreground mb-4"
          >
            Our <span className="gradient-text">Portfolio</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-body max-w-xl mx-auto"
          >
            A curated selection of our best work across video editing, design,
            development, and more.
          </motion.p>
        </div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setActiveCategory(cat)}
              data-ocid="portfolio.filter.tab"
              className={`px-5 py-2 rounded-full text-xs font-body font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-neon-blue-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground border border-border hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div
            data-ocid="portfolio.loading_state"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {["p1", "p2", "p3", "p4", "p5", "p6"].map((k) => (
              <div
                key={k}
                className="rounded-xl overflow-hidden border border-border"
              >
                <Skeleton className="aspect-video" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Portfolio grid — backend items */}
        {!isLoading && hasBackendItems && filteredBackend.length === 0 && (
          <div data-ocid="portfolio.empty_state" className="text-center py-20">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body">
              No portfolio items in this category yet.
            </p>
          </div>
        )}
        {!isLoading && hasBackendItems && filteredBackend.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBackend.map((item: PortfolioItem, i: number) => (
              <PortfolioCardWithImage
                key={item.id.toString()}
                item={item}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Portfolio grid — sample items */}
        {!isLoading && !hasBackendItems && filteredSamples.length === 0 && (
          <div data-ocid="portfolio.empty_state" className="text-center py-20">
            <p className="text-muted-foreground font-body">
              No items in this category.
            </p>
          </div>
        )}
        {!isLoading && !hasBackendItems && filteredSamples.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSamples.map((item, i) => (
              <PortfolioCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}

        {/* Sparkles banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground font-body">
            <Sparkles className="w-4 h-4 text-primary" />
            More work available — contact us to see your industry-specific
            portfolio
          </div>
        </motion.div>
      </div>
    </main>
  );
}
