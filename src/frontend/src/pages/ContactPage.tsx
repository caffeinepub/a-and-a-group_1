import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  CheckCircle2,
  ClipboardCopy,
  Copy,
  CreditCard,
  Loader2,
  Mail,
  MessageCircle,
  QrCode,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useBlobStorage, validateFile } from "../hooks/useBlobStorage";
import { useSubmitContact } from "../hooks/useQueries";
import {
  type Order,
  addOrder,
  generateOrderId,
  getCurrentUser,
  getPaymentSettings,
  isBlocked,
  updateOrderScreenshot,
} from "../utils/localData";

const SERVICES = [
  "Video Editing",
  "Thumbnail Design",
  "Graphic Design",
  "Logo Design",
  "YouTube Channel Setup",
  "Gaming Montage Editing",
  "Instagram Reel Editing",
  "Social Media Management",
  "Web Development",
  "Website Design",
  "App Development",
  "UI/UX Design",
  "SEO Optimization",
  "Animation / Motion Graphics",
  "AI Image Generation",
  "Website Maintenance",
  "Content Writing",
  "Brand Identity Design",
];

interface FormState {
  name: string;
  email: string;
  whatsappNumber: string;
  service: string;
  projectDetails: string;
  budget: string;
  deadline: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  whatsappNumber: "",
  service: "",
  projectDetails: "",
  budget: "",
  deadline: "",
};

// ─── Payment Section ─────────────────────────────────────────────────────────

function PaymentSection({ orderId }: { orderId: string }) {
  const settings = getPaymentSettings();
  const [upiCopied, setUpiCopied] = useState(false);
  const [bankCopied, setBankCopied] = useState(false);

  const copyUpi = () => {
    navigator.clipboard
      .writeText(settings.upiId)
      .then(() => {
        setUpiCopied(true);
        toast.success("UPI ID copied!");
        setTimeout(() => setUpiCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy"));
  };

  const copyBank = () => {
    const text = `Account Holder: ${settings.accountHolderName}\nAccount Number: ${settings.accountNumber}\nIFSC: ${settings.ifscCode}`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setBankCopied(true);
        toast.success("Bank details copied!");
        setTimeout(() => setBankCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy"));
  };

  const handlePayNow = () => {
    const url = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.accountHolderName)}&tn=Order%20${orderId}&cu=INR`;
    window.open(url, "_blank");
  };

  const handleScreenshot = () => {
    const msg = encodeURIComponent(
      `Hello A AND A GROUP\nI have completed the payment.\n\nOrder ID: ${orderId}`,
    );
    window.open(`https://wa.me/917380869635?text=${msg}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="mt-8 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-primary" />
        </div>
        <div className="text-left">
          <h3 className="font-display font-bold text-base text-foreground">
            Complete Payment
          </h3>
          <p className="text-xs text-muted-foreground font-body">
            Choose your preferred payment method
          </p>
        </div>
      </div>

      {/* Payment Status Banner */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/25">
        <span className="text-xs font-body text-muted-foreground">
          Order ID:{" "}
          <span className="font-mono font-bold text-foreground">{orderId}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-body font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Pending Verification
        </span>
      </div>

      {/* QR Code Card */}
      <div
        data-ocid="payment.qr.card"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-4 h-4 text-primary" />
          <h4 className="font-display font-semibold text-sm text-foreground">
            QR Code Payment
          </h4>
        </div>
        {settings.qrImageUrl ? (
          <div className="flex justify-center">
            <img
              src={settings.qrImageUrl}
              alt="Payment QR Code"
              className="max-w-[220px] w-full rounded-xl border border-border"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 rounded-xl border border-dashed border-border bg-secondary/30">
            <div className="text-center">
              <QrCode className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-body">
                QR code not set by admin yet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* UPI ID Card */}
      <div
        data-ocid="payment.upi.card"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-primary" />
          <h4 className="font-display font-semibold text-sm text-foreground">
            UPI ID Payment
          </h4>
        </div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/50 border border-border mb-3">
          <div>
            <span className="text-[10px] text-muted-foreground/60 font-body uppercase tracking-wide block">
              UPI ID
            </span>
            <span className="font-mono font-bold text-sm text-foreground">
              {settings.upiId}
            </span>
          </div>
          <button
            type="button"
            onClick={copyUpi}
            data-ocid="payment.upi.copy.button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
          >
            <Copy className="w-3 h-3" />
            {upiCopied ? "Copied!" : "Copy UPI ID"}
          </button>
        </div>
        <Button
          onClick={handlePayNow}
          data-ocid="payment.upi.paynow.button"
          className="w-full bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300 font-display font-bold"
        >
          <Send className="w-4 h-4 mr-2" />
          Pay Now via UPI
        </Button>
      </div>

      {/* Bank Transfer Card */}
      <div
        data-ocid="payment.bank.card"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-accent" />
          <h4 className="font-display font-semibold text-sm text-foreground">
            Bank Transfer
          </h4>
        </div>
        <div className="space-y-2 mb-4">
          {[
            {
              label: "Account Holder Name",
              value: settings.accountHolderName,
            },
            { label: "Account Number", value: settings.accountNumber },
            { label: "IFSC Code", value: settings.ifscCode },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <span className="text-[10px] text-muted-foreground/60 font-body uppercase tracking-wide">
                {item.label}
              </span>
              <span className="font-mono font-semibold text-sm text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={copyBank}
          data-ocid="payment.bank.copy.button"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all"
        >
          <Copy className="w-3.5 h-3.5" />
          {bankCopied ? "Copied!" : "Copy Bank Details"}
        </button>
      </div>

      {/* Contact Team Card */}
      <div
        data-ocid="payment.contact.card"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <p className="text-xs font-body text-muted-foreground mb-3">
          If payment fails or you have an issue, contact us:
        </p>
        <div className="flex gap-2 flex-wrap">
          <a
            href="https://wa.me/917380869635"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp Support
          </a>
          <a
            href="mailto:workfora.agroup@zohomail.in"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            Email Support
          </a>
        </div>
      </div>

      {/* Send Payment Screenshot */}
      <Button
        onClick={handleScreenshot}
        data-ocid="payment.screenshot.primary_button"
        className="w-full py-5 font-display font-bold text-base bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all duration-300 shadow-[0_0_20px_rgba(37,211,102,0.25)] hover:shadow-[0_0_35px_rgba(37,211,102,0.5)]"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Send Payment Screenshot
      </Button>
    </motion.div>
  );
}

// ─── Screenshot Upload Section ───────────────────────────────────────────────

function ScreenshotUploadSection({ order }: { order: Order }) {
  const { uploadFile, uploadProgress, isUploading } = useBlobStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [retryMessage, setRetryMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(
        validation.reason ?? "Upload failed. Please check file type and size.",
      );
      return;
    }

    setUploadStatus("uploading");
    setRetryMessage("");

    try {
      const blobId = await uploadFile(file, {
        onRetry: (attempt) => {
          setRetryMessage(`Upload failed. Retrying... (${attempt}/${3})`);
        },
      });
      updateOrderScreenshot(order.id, blobId);
      setUploadStatus("success");
      setRetryMessage("");
      toast.success("Screenshot uploaded successfully ✅");
    } catch {
      setUploadStatus("error");
      setRetryMessage("Upload failed. Please try again.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="mt-6"
    >
      <div className="flex items-center gap-3 pb-3 border-b border-border mb-4">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
          <Upload className="w-4 h-4 text-accent" />
        </div>
        <div className="text-left">
          <h3 className="font-display font-bold text-base text-foreground">
            Upload Payment Screenshot
          </h3>
          <p className="text-xs text-muted-foreground font-body">
            Attach your payment proof to this order
          </p>
        </div>
      </div>

      {uploadStatus === "success" ? (
        <div
          data-ocid="order.screenshot.success_state"
          className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/8"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-sm font-display font-semibold text-emerald-400">
              Screenshot uploaded successfully ✅
            </p>
            <p className="text-xs text-muted-foreground font-body">
              Your payment screenshot has been attached to Order {order.orderId}
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Drop zone */}
          <button
            type="button"
            data-ocid="order.screenshot.dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            aria-label="Upload payment screenshot"
            className={`w-full relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
              isDragOver
                ? "border-primary bg-primary/10"
                : uploadStatus === "error"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border/60 bg-secondary/20 hover:border-primary/40 hover:bg-primary/5"
            }`}
            style={
              isDragOver
                ? {
                    boxShadow: "0 0 20px oklch(0.75 0.18 210 / 0.2)",
                  }
                : undefined
            }
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                uploadStatus === "error"
                  ? "bg-destructive/10 border border-destructive/20"
                  : "bg-primary/10 border border-primary/20"
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Upload
                  className={`w-5 h-5 ${uploadStatus === "error" ? "text-destructive" : "text-primary"}`}
                />
              )}
            </div>

            {isUploading ? (
              <div className="w-full max-w-xs">
                <p className="text-sm font-display font-semibold text-foreground mb-2">
                  Uploading...
                </p>
                {retryMessage && (
                  <p className="text-xs text-amber-400 font-body mb-2">
                    {retryMessage}
                  </p>
                )}
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-body mt-1 text-right">
                  {uploadProgress}%
                </p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-sm font-display font-semibold text-foreground">
                    {uploadStatus === "error"
                      ? "Upload failed. Please try again."
                      : "Click or drag & drop your screenshot here"}
                  </p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    JPG, PNG, WEBP up to 10MB
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  data-ocid="order.screenshot.upload_button"
                  className={`mt-1 font-display font-semibold text-xs ${
                    uploadStatus === "error"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25"
                  }`}
                  variant={uploadStatus === "error" ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {uploadStatus === "error" ? "Try Again" : "Choose File"}
                </Button>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
            tabIndex={-1}
          />
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Contact Page ────────────────────────────────────────────────────────

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const { mutateAsync: submitContact, isPending } = useSubmitContact();

  // Service quick-message flow
  const [showSendMsg, setShowSendMsg] = useState(false);
  const [showWaBtn, setShowWaBtn] = useState(false);

  const handleServiceChange = (value: string) => {
    setForm((p) => ({ ...p, service: value }));
    setShowSendMsg(false);
    setShowWaBtn(false);
    if (value) {
      // slight delay to reset first, then show
      setTimeout(() => setShowSendMsg(true), 50);
    }
  };

  const handleSendMsgClick = () => {
    setShowWaBtn(true);
  };

  const handleServiceWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hello A AND A GROUP\nI want to discuss this service:\n\nService: ${form.service}\n\nPlease provide more details.`,
    );
    window.open(`https://wa.me/917380869635?text=${msg}`, "_blank");
    setShowWaBtn(false);
    setShowSendMsg(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is blocked
    const currentUser = getCurrentUser();
    if (currentUser && isBlocked(currentUser.code)) {
      toast.error("You have been blocked from submitting forms.");
      return;
    }

    // Generate order ID
    const orderId = generateOrderId();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const order: Order = {
      id,
      orderId,
      name: form.name,
      email: form.email,
      whatsappNumber: form.whatsappNumber,
      service: form.service,
      projectDetails: form.projectDetails,
      budget: form.budget,
      deadline: form.deadline,
      status: "received",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    addOrder(order);

    // Non-blocking backend submit
    submitContact({
      name: form.name,
      email: form.email,
      projectDetails: form.projectDetails,
    }).catch(() => {
      // silent
    });

    setSubmittedOrder(order);
    setSubmitted(true);
    toast.success("Order submitted successfully!");
  };

  const handleCopyOrderId = () => {
    if (!submittedOrder) return;
    navigator.clipboard
      .writeText(submittedOrder.orderId)
      .then(() => toast.success("Order ID copied to clipboard!"))
      .catch(() => toast.error("Failed to copy Order ID"));
  };

  const buildWhatsAppMessage = (order: Order) => {
    return `Hello A AND A GROUP,\n\nOrder ID: ${order.orderId}\n\nName: ${order.name}\nService: ${order.service}\nProject Details: ${order.projectDetails}\nBudget: ${order.budget}\nDeadline: ${order.deadline}`;
  };

  const buildEmailBody = (order: Order) => {
    return `Hello A AND A GROUP,\n\nOrder ID: ${order.orderId}\n\nName: ${order.name}\nEmail: ${order.email}\nWhatsApp: ${order.whatsappNumber}\nService: ${order.service}\nProject Details: ${order.projectDetails}\nBudget: ${order.budget}\nDeadline: ${order.deadline}\n\nThank you.`;
  };

  const handleWhatsApp = () => {
    if (!submittedOrder) return;
    const msg = buildWhatsAppMessage(submittedOrder);
    window.open(
      `https://wa.me/917380869635?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  const handleEmail = () => {
    if (!submittedOrder) return;
    const subject = `New Order Request – A AND A GROUP – Order ID: ${submittedOrder.orderId}`;
    const body = buildEmailBody(submittedOrder);
    window.open(
      `mailto:workfora.agroup@zohomail.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank",
    );
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setSubmittedOrder(null);
    setShowSendMsg(false);
    setShowWaBtn(false);
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
            Place Your Order
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
            Fill in the form below and get a unique Order ID. We'll get back to
            you within 24 hours with a custom proposal.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form or Thank You — spans 3 cols */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                /* ── Order Form ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="rounded-2xl border border-border bg-card p-8"
                >
                  <h2 className="font-display font-bold text-xl text-foreground mb-6">
                    Order Request Form
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-sm font-body text-muted-foreground"
                      >
                        Your Name *
                      </Label>
                      <Input
                        id="name"
                        data-ocid="order.name.input"
                        value={form.name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="Enter your full name"
                        required
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-body text-muted-foreground"
                      >
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        data-ocid="order.email.input"
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

                    {/* WhatsApp Number */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="whatsappNumber"
                        className="text-sm font-body text-muted-foreground"
                      >
                        WhatsApp Number *
                      </Label>
                      <Input
                        id="whatsappNumber"
                        data-ocid="order.whatsapp.input"
                        type="tel"
                        value={form.whatsappNumber}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            whatsappNumber: e.target.value,
                          }))
                        }
                        placeholder="+91 XXXXX XXXXX"
                        required
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                      />
                    </div>

                    {/* Service */}
                    <div className="space-y-2">
                      <Label className="text-sm font-body text-muted-foreground">
                        Service Required *
                      </Label>
                      <Select
                        value={form.service}
                        onValueChange={handleServiceChange}
                        required
                      >
                        <SelectTrigger
                          data-ocid="order.service.select"
                          className="bg-secondary border-border text-foreground focus:border-primary/50"
                        >
                          <SelectValue placeholder="Select a service..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {SERVICES.map((svc) => (
                            <SelectItem
                              key={svc}
                              value={svc}
                              className="font-body text-foreground focus:bg-primary/10 focus:text-primary"
                            >
                              {svc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Service Quick-Message Buttons */}
                      <AnimatePresence>
                        {showSendMsg && !showWaBtn && (
                          <motion.div
                            key="sendmsg"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button
                              type="button"
                              onClick={handleSendMsgClick}
                              data-ocid="order.service.sendmsg.button"
                              className="w-full mt-2 bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300 font-display font-semibold"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Send Message
                            </Button>
                          </motion.div>
                        )}
                        {showWaBtn && (
                          <motion.div
                            key="wabtn"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button
                              type="button"
                              onClick={handleServiceWhatsApp}
                              data-ocid="order.service.whatsapp.button"
                              className="w-full mt-2 bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transition-all duration-300 font-display font-semibold"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Send WhatsApp Message
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="projectDetails"
                        className="text-sm font-body text-muted-foreground"
                      >
                        Project Details *
                      </Label>
                      <Textarea
                        id="projectDetails"
                        data-ocid="order.projectdetails.textarea"
                        value={form.projectDetails}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            projectDetails: e.target.value,
                          }))
                        }
                        placeholder="Describe your project, requirements, and any specific details..."
                        required
                        rows={4}
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 resize-none"
                      />
                    </div>

                    {/* Budget */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="budget"
                        className="text-sm font-body text-muted-foreground"
                      >
                        Budget *
                      </Label>
                      <Input
                        id="budget"
                        data-ocid="order.budget.input"
                        value={form.budget}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, budget: e.target.value }))
                        }
                        placeholder="e.g. ₹ XYZ"
                        required
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                      />
                    </div>

                    {/* Deadline */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="deadline"
                        className="text-sm font-body text-muted-foreground"
                      >
                        Deadline *
                      </Label>
                      <Input
                        id="deadline"
                        data-ocid="order.deadline.input"
                        value={form.deadline}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, deadline: e.target.value }))
                        }
                        placeholder="e.g. 3 days, 1 week"
                        required
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                      />
                    </div>

                    <Button
                      type="submit"
                      data-ocid="order.submit.primary_button"
                      disabled={isPending || !form.service}
                      className="w-full py-6 font-display font-bold text-base bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300 disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Order Request
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center font-body">
                      After submitting, you'll receive a unique Order ID to
                      track your request.
                    </p>
                  </form>
                </motion.div>
              ) : (
                /* ── Thank You Screen ── */
                <motion.div
                  key="thankyou"
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  data-ocid="order.thankyou.panel"
                  className="rounded-2xl border border-emerald-500/30 bg-card p-8 text-center"
                >
                  {/* Success Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-6"
                  >
                    <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-display font-bold text-2xl text-foreground mb-3"
                  >
                    Order Submitted Successfully!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-sm text-muted-foreground font-body mb-6 max-w-md mx-auto"
                  >
                    Thank you for your order. Your Order ID is:{" "}
                    <strong className="text-foreground">
                      {submittedOrder?.orderId}
                    </strong>
                    . Please save this ID for future communication or support.
                  </motion.p>

                  {/* Order ID Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    data-ocid="order.thankyou.orderid.card"
                    className="inline-flex items-center gap-3 px-6 py-4 rounded-xl border border-primary/40 bg-primary/10 mb-6"
                  >
                    <span className="font-mono font-bold text-2xl text-primary tracking-wider">
                      {submittedOrder?.orderId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOrderId}
                      data-ocid="order.thankyou.copy.button"
                      aria-label="Copy Order ID"
                      className="p-1.5 rounded-lg text-primary/60 hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <ClipboardCopy className="w-4 h-4" />
                    </button>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-col sm:flex-row gap-3 mb-4"
                  >
                    <Button
                      onClick={handleWhatsApp}
                      data-ocid="order.thankyou.whatsapp.primary_button"
                      className="flex-1 py-5 font-display font-bold bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all duration-300 shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_30px_rgba(37,211,102,0.5)]"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send via WhatsApp
                    </Button>
                    <Button
                      onClick={handleEmail}
                      data-ocid="order.thankyou.email.primary_button"
                      className="flex-1 py-5 font-display font-bold bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send via Email
                    </Button>
                  </motion.div>

                  {/* Payment Section */}
                  {submittedOrder && (
                    <PaymentSection orderId={submittedOrder.orderId} />
                  )}

                  {/* Payment Screenshot Upload */}
                  {submittedOrder && (
                    <ScreenshotUploadSection order={submittedOrder} />
                  )}

                  {/* Reset */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6"
                  >
                    <button
                      type="button"
                      onClick={handleReset}
                      data-ocid="order.thankyou.reset.button"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-body underline underline-offset-4"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Submit Another Order
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Contact Info — spans 2 cols */}
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

            {/* Order ID Info Box */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-foreground mb-1">
                    Automatic Order ID
                  </p>
                  <p className="text-xs text-muted-foreground font-body leading-relaxed">
                    Every order gets a unique{" "}
                    <span className="font-mono text-amber-400">
                      AAG-XXXXXXX
                    </span>{" "}
                    identifier. Use it to track your order and communicate with
                    our team.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
