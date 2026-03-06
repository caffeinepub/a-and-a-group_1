import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, MessageCircle, Send, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSubmitContact } from "../hooks/useQueries";
import { getCurrentUser, isBlocked } from "../utils/localData";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", projectDetails: "" });
  const { mutateAsync: submitContact, isPending } = useSubmitContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is blocked
    const currentUser = getCurrentUser();
    if (currentUser && isBlocked(currentUser.code)) {
      toast.error("You have been blocked from submitting forms.");
      return;
    }

    try {
      // Save to backend
      await submitContact({
        name: form.name,
        email: form.email,
        projectDetails: form.projectDetails,
      });
    } catch {
      // Non-blocking — still redirect to WhatsApp
    }

    toast.success("Redirecting to WhatsApp...");

    // Build WhatsApp URL
    const waMessage = `Hi A AND A GROUP, I need your services. My name is ${form.name}. Project Details: ${form.projectDetails}`;
    const waUrl = `https://wa.me/917380869635?text=${encodeURIComponent(waMessage)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <main className="pt-24 pb-24">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-body font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Get in Touch
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-bold text-4xl lg:text-6xl text-foreground mb-4"
          >
            Let's <span className="gradient-text">Connect</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-body max-w-xl mx-auto"
          >
            Tell us about your project and we'll get back to you within 24 hours
            with a custom proposal.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form — spans 3 cols */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="font-display font-bold text-xl text-foreground mb-6">
                Send a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-body text-muted-foreground"
                  >
                    Your Name *
                  </Label>
                  <Input
                    id="name"
                    data-ocid="contact.name.input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Enter your full name"
                    required
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-body text-muted-foreground"
                  >
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    data-ocid="contact.email.input"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="your@email.com"
                    required
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="projectDetails"
                    className="text-sm font-body text-muted-foreground"
                  >
                    Project Details *
                  </Label>
                  <Textarea
                    id="projectDetails"
                    data-ocid="contact.projectdetails.textarea"
                    value={form.projectDetails}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, projectDetails: e.target.value }))
                    }
                    placeholder="Tell us about your project, requirements, timeline, and budget..."
                    required
                    rows={6}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  data-ocid="contact.submit.primary_button"
                  disabled={isPending}
                  className="w-full py-6 font-display font-bold text-base bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message via WhatsApp
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center font-body">
                  After submitting, you'll be redirected to WhatsApp to continue
                  the conversation.
                </p>
              </form>
            </div>
          </motion.div>

          {/* Contact Info — spans 2 cols */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-5"
          >
            {/* WhatsApp Card */}
            <a
              href="https://wa.me/917380869635"
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 hover:border-[#25D366]/50 hover:bg-[#25D366]/10 transition-all duration-300 p-6"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#25D366]/20 border border-[#25D366]/30 group-hover:border-[#25D366]/60 transition-all">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm text-foreground">
                    WhatsApp
                  </div>
                  <div className="text-xs text-muted-foreground font-body">
                    Fastest response
                  </div>
                </div>
              </div>
              <div className="font-display font-semibold text-[#25D366]">
                +91 73808 69635
              </div>
              <p className="text-xs text-muted-foreground font-body mt-2">
                Available Mon–Sat, 9AM–9PM IST. Average response time: under 1
                hour.
              </p>
            </a>

            {/* Email Card */}
            <a
              href="mailto:workfora.agroup@zohomail.in"
              className="group block rounded-2xl border border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 p-6"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/20 border border-primary/30 group-hover:border-primary/60 transition-all">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm text-foreground">
                    Email
                  </div>
                  <div className="text-xs text-muted-foreground font-body">
                    Detailed inquiries
                  </div>
                </div>
              </div>
              <div className="font-display font-semibold text-primary text-sm break-all">
                workfora.agroup@zohomail.in
              </div>
              <p className="text-xs text-muted-foreground font-body mt-2">
                For detailed project briefs, RFPs, and business proposals.
              </p>
            </a>

            {/* Why Choose Us */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display font-bold text-sm text-foreground mb-4">
                Why Choose A AND A GROUP?
              </h3>
              <ul className="space-y-3">
                {[
                  "Fast turnaround — most projects in 24–72 hours",
                  "Unlimited revisions until you're satisfied",
                  "18+ services under one roof",
                  "4.9/5 average client satisfaction",
                  "Transparent pricing, no hidden fees",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    <span className="text-xs text-muted-foreground font-body leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
