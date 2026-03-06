import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Home", path: "/", ocid: "nav.home.link" },
  { label: "Services", path: "/services", ocid: "nav.services.link" },
  { label: "Portfolio", path: "/portfolio", ocid: "nav.portfolio.link" },
  { label: "Reviews", path: "/reviews", ocid: "nav.reviews.link" },
  { label: "My Orders", path: "/track-order", ocid: "nav.track_order.link" },
  { label: "Contact", path: "/contact", ocid: "nav.contact.link" },
];

function dispatchOpenSupport() {
  window.dispatchEvent(new CustomEvent("aag-open-support"));
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally resets on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-border shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/30 group-hover:border-primary/70 transition-all duration-300 group-hover:shadow-neon-blue-sm overflow-hidden">
              <img
                src="/assets/generated/aag-logo-transparent.dim_200x200.png"
                alt="A AND A GROUP logo"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (
                    e.currentTarget.nextElementSibling as HTMLElement | null
                  )?.style.setProperty("display", "block");
                }}
              />
              <Zap
                className="w-5 h-5 text-primary hidden"
                fill="currentColor"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-base text-foreground tracking-wider">
                A AND A <span className="gradient-text">GROUP</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-body tracking-widest uppercase">
                Digital Agency
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    data-ocid={link.ocid}
                    className={`relative px-4 py-2 text-sm font-body font-medium transition-all duration-200 rounded-md
                      ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-md bg-primary/10 border border-primary/20"
                        style={{ borderRadius: 6 }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop CTA + Admin */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              data-ocid="nav.support.link"
              onClick={dispatchOpenSupport}
              className="text-xs font-body text-muted-foreground hover:text-accent-foreground px-3 py-1.5 rounded border border-border hover:border-accent/40 hover:bg-accent/10 transition-all duration-200"
            >
              Support
            </button>
            <Link
              to="/admin"
              data-ocid="nav.admin.link"
              className="text-xs font-body text-muted-foreground hover:text-accent-foreground px-3 py-1.5 rounded border border-border hover:border-accent/40 hover:bg-accent/10 transition-all duration-200"
            >
              Admin
            </Link>
            <Link
              to="/contact"
              className="px-5 py-2 text-sm font-display font-semibold rounded-lg bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300 hover:scale-105"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden glass border-t border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    data-ocid={link.ocid}
                    className={`px-4 py-3 text-sm font-body rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  data-ocid="nav.support.link"
                  onClick={dispatchOpenSupport}
                  className="px-4 py-3 text-sm font-body text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all text-left"
                >
                  Support
                </button>
                <Link
                  to="/admin"
                  data-ocid="nav.admin.link"
                  className="px-4 py-3 text-sm font-body text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                >
                  Admin Dashboard
                </Link>
                <Link
                  to="/contact"
                  className="px-4 py-3 text-sm font-display font-semibold text-center rounded-lg bg-primary text-primary-foreground"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
