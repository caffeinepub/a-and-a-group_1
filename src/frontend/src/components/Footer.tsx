import { Link } from "@tanstack/react-router";
import { ExternalLink, Mail, MessageCircle, Zap } from "lucide-react";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Reviews", path: "/reviews" },
  { label: "Contact", path: "/contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border mt-24">
      {/* Glow top edge */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/30 group-hover:border-primary/60 transition-all duration-300">
                <Zap className="w-5 h-5 text-primary" fill="currentColor" />
              </div>
              <span className="font-display font-bold text-lg">
                A AND A <span className="gradient-text">GROUP</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-xs">
              All Digital Services in One Place. We craft digital excellence for
              brands that want to stand out.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/917380869635"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 hover:border-[#25D366]/50 transition-all duration-200"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="mailto:workfora.agroup@zohomail.in"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-200"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-sm text-foreground tracking-widest uppercase">
              Navigation
            </h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-body"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-sm text-foreground tracking-widest uppercase">
              Contact
            </h3>
            <div className="space-y-3">
              <a
                href="mailto:workfora.agroup@zohomail.in"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                <span className="font-body break-all">
                  workfora.agroup@zohomail.in
                </span>
              </a>
              <a
                href="https://wa.me/917380869635"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-[#25D366] transition-colors group"
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0 text-[#25D366]" />
                <span className="font-body">+91 73808 69635</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-body">
            © {year} A AND A GROUP. All rights reserved.
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
          >
            <span>Built with</span>
            <span className="text-red-400">♥</span>
            <span>using caffeine.ai</span>
            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>
    </footer>
  );
}
