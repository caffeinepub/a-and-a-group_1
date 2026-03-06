import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  ChevronRight,
  Globe,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { Review, Service } from "../backend.d";
import ReviewCard from "../components/ReviewCard";
import ServiceCard from "../components/ServiceCard";
import { DEFAULT_REVIEWS, DEFAULT_SERVICES } from "../data/services";
import { useListServices } from "../hooks/useQueries";
import { useListReviews } from "../hooks/useQueries";

const stats = [
  { icon: Globe, label: "Projects Delivered", value: "500+" },
  { icon: Users, label: "Happy Clients", value: "200+" },
  { icon: Award, label: "Services Offered", value: "18+" },
  { icon: Sparkles, label: "Years Experience", value: "5+" },
];

export default function HomePage() {
  const { data: backendServices } = useListServices();
  const { data: backendReviews } = useListReviews();

  // Use backend data if available, otherwise fall back to defaults
  const services: Array<{
    id: string | number;
    title: string;
    icon: string;
    description: string;
    rating: number;
    isAvailable: boolean;
  }> =
    backendServices && backendServices.length > 0
      ? backendServices.map((s: Service) => ({
          id: s.id.toString(),
          title: s.title,
          icon: s.icon,
          description: s.description,
          rating: s.rating,
          isAvailable: s.isAvailable,
        }))
      : DEFAULT_SERVICES;

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

  const featuredServices = services.slice(0, 6);
  const featuredReviews = reviews.slice(0, 3);

  return (
    <main>
      {/* ─── Hero Section ───────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src="/assets/generated/hero-bg.dim_1600x900.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-[100px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.78 0.2 208) 1px, transparent 1px), linear-gradient(to right, oklch(0.78 0.2 208) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-body font-medium mb-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Premium Digital Agency Services
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-foreground leading-[1.05] tracking-tight mb-6"
            >
              A AND A{" "}
              <span className="gradient-text text-glow-blue">GROUP</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-body text-xl sm:text-2xl text-muted-foreground mb-4 tracking-wide"
            >
              All Digital Services in One Place
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="font-body text-base text-muted-foreground/70 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              From video editing to web development, brand identity to SEO — we
              craft digital excellence that elevates your brand and drives real
              results.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/services"
                data-ocid="hero.view_services.primary_button"
                className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-display font-bold text-base hover:shadow-neon-blue hover:scale-105 transition-all duration-300"
              >
                View Services
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="flex items-center gap-2 px-8 py-4 rounded-xl border border-border bg-secondary/50 text-foreground font-display font-semibold text-base hover:border-primary/40 hover:bg-secondary transition-all duration-300"
              >
                Get a Quote
              </Link>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-200"
              >
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="font-display font-bold text-2xl text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground font-body mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* ─── Services Section ────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-body font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              What We Offer
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display font-bold text-4xl lg:text-5xl text-foreground mb-4"
            >
              Our <span className="gradient-text">Services</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground font-body max-w-xl mx-auto"
            >
              18 professional services designed to grow your brand and digital
              presence.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredServices.map((service, i) => (
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

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-primary/30 bg-primary/5 text-primary font-display font-semibold hover:bg-primary/10 hover:border-primary/50 hover:shadow-neon-blue-sm transition-all duration-300"
            >
              View All 18 Services
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-12 text-center"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-foreground mb-4">
              Ready to Transform Your{" "}
              <span className="gradient-text">Digital Presence?</span>
            </h2>
            <p className="text-muted-foreground font-body mb-8 max-w-lg mx-auto">
              Let's discuss your project. Get a free consultation and custom
              quote tailored to your needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/917380869635"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#25D366] text-white font-display font-bold hover:shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-105 transition-all duration-300"
              >
                Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-primary/30 bg-primary/5 text-primary font-display font-semibold hover:bg-primary/10 transition-all duration-300"
              >
                Send a Message
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Reviews Section ─────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-body font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Client Testimonials
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display font-bold text-4xl lg:text-5xl text-foreground mb-4"
            >
              What Clients <span className="gradient-text">Say</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredReviews.map((review, i) => (
              <ReviewCard
                key={review.id}
                clientName={review.clientName}
                reviewText={review.reviewText}
                rating={review.rating}
                service={review.service}
                index={i}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-accent/30 bg-accent/5 text-accent font-display font-semibold hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
            >
              View All Reviews
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
