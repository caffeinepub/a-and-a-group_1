import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  HelpCircle,
  Mail,
  MessageCircle,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function FloatingWidgets() {
  const [supportOpen, setSupportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ name: "", issue: "" });

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Report submitted! We'll look into it shortly.");
    setReportForm({ name: "", issue: "" });
    setReportOpen(false);
    setSupportOpen(false);
  };

  return (
    <>
      {/* WhatsApp Float Button — bottom-left */}
      <a
        href="https://wa.me/917380869635"
        target="_blank"
        rel="noopener noreferrer"
        data-ocid="whatsapp.float.button"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center bg-[#25D366] hover:bg-[#20bc59] shadow-[0_4px_20px_rgba(37,211,102,0.5)] hover:shadow-[0_4px_30px_rgba(37,211,102,0.7)] transition-all duration-300 hover:scale-110"
        aria-label="WhatsApp Chat"
      >
        <MessageCircle className="w-6 h-6 text-white" fill="white" />
      </a>

      {/* Support Widget — bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {supportOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="glass border border-border rounded-2xl p-4 w-64 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-semibold text-sm text-foreground">
                  Support
                </span>
                <button
                  type="button"
                  onClick={() => setSupportOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {/* WhatsApp Support */}
                <a
                  href="https://wa.me/917380869635"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:border-[#25D366]/50 hover:bg-[#25D366]/20 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  </div>
                  <div>
                    <div className="text-xs font-display font-semibold text-foreground">
                      WhatsApp Support
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Fast response
                    </div>
                  </div>
                </a>

                {/* Email Support */}
                <a
                  href="mailto:workfora.agroup@zohomail.in"
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/50 hover:bg-primary/20 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-display font-semibold text-foreground">
                      Email Support
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      workfora.agroup@zohomail.in
                    </div>
                  </div>
                </a>

                {/* Report Problem */}
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 hover:border-destructive/50 hover:bg-destructive/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-display font-semibold text-foreground">
                      Report a Problem
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Glitch or issue
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Support Toggle Button */}
        <motion.button
          data-ocid="support.widget.button"
          onClick={() => setSupportOpen(!supportOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            supportOpen
              ? "bg-secondary border border-border text-foreground"
              : "bg-accent text-accent-foreground shadow-neon-purple hover:shadow-neon-purple hover:scale-110"
          }`}
          whileTap={{ scale: 0.95 }}
          aria-label="Support"
        >
          <AnimatePresence mode="wait">
            {supportOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <HelpCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="glass border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              Report a Problem
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReport} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="report-name"
                className="text-sm text-muted-foreground"
              >
                Your Name
              </Label>
              <Input
                id="report-name"
                value={reportForm.name}
                onChange={(e) =>
                  setReportForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Enter your name"
                required
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="report-issue"
                className="text-sm text-muted-foreground"
              >
                Describe the Issue
              </Label>
              <Textarea
                id="report-issue"
                value={reportForm.issue}
                onChange={(e) =>
                  setReportForm((p) => ({ ...p, issue: e.target.value }))
                }
                placeholder="Describe the problem or glitch you encountered..."
                required
                rows={4}
                className="bg-secondary border-border text-foreground resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReportOpen(false)}
                className="flex-1 border-border text-muted-foreground"
                data-ocid="report.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid="report.submit_button"
              >
                Submit Report
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
