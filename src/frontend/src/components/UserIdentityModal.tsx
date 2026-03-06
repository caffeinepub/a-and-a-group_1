import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Sparkles, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  addUser,
  generateUserCode,
  getCurrentUser,
  setCurrentUser,
} from "../utils/localData";

interface Props {
  onComplete: () => void;
}

type Step = "name" | "welcome";

export default function UserIdentityModal({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { actor } = useActor();

  const handleSubmitName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSubmitting(true);

    // Generate unique code
    const code = generateUserCode();

    // Persist to localStorage
    setCurrentUser(trimmed, code);
    addUser({
      userCode: code,
      name: trimmed,
      registeredAt: new Date().toISOString(),
      isBlocked: false,
    });

    // Also save to central backend so admin can see all users across devices
    // We store as a contact submission with a special prefix so admin knows it's a registration
    try {
      if (actor) {
        await actor.submitContact(
          trimmed,
          `user_reg_${code}@aag.internal`,
          `USER_REGISTRATION|code:${code}|name:${trimmed}|registeredAt:${new Date().toISOString()}`,
        );
      }
    } catch {
      // Backend save optional — localStorage is always the local source of truth
    }

    setGeneratedCode(code);
    setStep("welcome");
    setIsSubmitting(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      toast.success("User code copied to clipboard!");
    });
  };

  return (
    <div
      data-ocid="identity.modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse 100% 100% at 50% 50%, oklch(0.08 0.02 265 / 0.97) 0%, oklch(0.06 0.01 265 / 0.99) 100%)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 210) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.62 0.22 295) 0%, transparent 70%)",
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {step === "name" && (
          <motion.div
            key="name-step"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md"
          >
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 mb-4 animate-pulse-glow">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display font-bold text-2xl text-foreground mb-1">
                  A AND A GROUP
                </h1>
                <p className="text-xs text-muted-foreground font-body">
                  All Digital Services in One Place
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-border mb-8" />

              <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-2">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-display font-bold text-lg text-foreground">
                    Welcome, Visitor!
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground font-body">
                  Before you explore, please enter your name. We'll generate a
                  unique ID for you.
                </p>
              </div>

              <form onSubmit={handleSubmitName} className="space-y-4">
                <Input
                  data-ocid="identity.name.input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  required
                  autoFocus
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 py-5 text-base"
                />
                <Button
                  type="submit"
                  data-ocid="identity.submit.primary_button"
                  disabled={!name.trim() || isSubmitting}
                  className="w-full py-6 font-display font-bold text-base bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300 disabled:opacity-50"
                >
                  Continue to Website
                </Button>
              </form>

              <p className="text-xs text-muted-foreground/60 font-body text-center mt-4">
                Your name and generated code help us improve your experience.
              </p>
            </div>
          </motion.div>
        )}

        {step === "welcome" && (
          <motion.div
            key="welcome-step"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md"
          >
            <div className="rounded-2xl border border-primary/30 bg-card p-8 shadow-card glow-blue-sm">
              {/* Success icon */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/40 mb-4"
                >
                  <span className="text-2xl">🎉</span>
                </motion.div>
                <h2 className="font-display font-bold text-2xl text-foreground mb-1">
                  Welcome,{" "}
                  <span className="gradient-text">
                    {getCurrentUser()?.name}!
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground font-body">
                  Your unique identity has been created.
                </p>
              </div>

              {/* User Code Display */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-6">
                <p className="text-xs text-muted-foreground font-body mb-2 text-center uppercase tracking-widest">
                  Your User Code
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-bold tracking-[0.2em] text-primary text-glow-blue">
                    {generatedCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    data-ocid="identity.copy.button"
                    className="p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all text-primary"
                    aria-label="Copy user code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4 mb-6 space-y-2">
                <p className="text-xs font-display font-semibold text-foreground">
                  Keep this code safe!
                </p>
                <ul className="space-y-1.5">
                  {[
                    "This code identifies you on our platform",
                    "Admins may use it to grant special access",
                    "It's shown in your browser — copy it now",
                  ].map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2 text-xs text-muted-foreground font-body"
                    >
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={onComplete}
                data-ocid="identity.explore.primary_button"
                className="w-full py-6 font-display font-bold text-base bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300"
              >
                Explore A AND A GROUP →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
