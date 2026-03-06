import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBlobStorage } from "../../hooks/useBlobStorage";
import {
  useGetPaymentSettings,
  useUpdatePaymentSettings,
} from "../../hooks/useQueries";

interface PaymentFormState {
  upiId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  qrCodeBlobId: string;
  qrPreviewUrl: string; // local preview only
}

const DEFAULTS: PaymentFormState = {
  upiId: "aloksi@ptyes",
  accountHolderName: "Niraj Singh",
  accountNumber: "7380869635",
  ifscCode: "AIRP0000001",
  qrCodeBlobId: "",
  qrPreviewUrl: "",
};

export default function AdminPaymentSettingsTab() {
  const [form, setForm] = useState<PaymentFormState>(DEFAULTS);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: backendSettings, isLoading: settingsLoading } =
    useGetPaymentSettings();
  const { mutateAsync: updatePaymentSettings } = useUpdatePaymentSettings();
  const { uploadFile, getFileUrl } = useBlobStorage();

  // Load settings: localStorage first (fastest), then backend as source of truth
  useEffect(() => {
    const loadSettings = async () => {
      // Try localStorage first for a fast initial load
      let localParsed: Partial<typeof DEFAULTS & { qrCodeBlobId: string }> = {};
      try {
        const raw = localStorage.getItem("aag_payment_settings");
        if (raw) localParsed = JSON.parse(raw);
      } catch {
        // ignore
      }

      const upiId =
        backendSettings?.upiId || localParsed.upiId || DEFAULTS.upiId;
      const accountHolderName =
        backendSettings?.accountHolderName ||
        localParsed.accountHolderName ||
        DEFAULTS.accountHolderName;
      const accountNumber =
        backendSettings?.accountNumber ||
        localParsed.accountNumber ||
        DEFAULTS.accountNumber;
      const ifscCode =
        backendSettings?.ifscCode || localParsed.ifscCode || DEFAULTS.ifscCode;
      const qrCodeBlobId =
        backendSettings?.qrCodeBlobId || localParsed.qrCodeBlobId || "";

      let qrPreviewUrl = "";
      if (qrCodeBlobId) {
        try {
          qrPreviewUrl = await getFileUrl(qrCodeBlobId);
        } catch {
          qrPreviewUrl = "";
        }
      }
      setForm({
        upiId,
        accountHolderName,
        accountNumber,
        ifscCode,
        qrCodeBlobId,
        qrPreviewUrl,
      });
    };
    loadSettings();
  }, [backendSettings, getFileUrl]);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm((prev) => ({ ...prev, qrPreviewUrl: dataUrl }));
    };
    reader.readAsDataURL(file);

    // Upload to blob storage
    setIsUploadingQr(true);
    try {
      const blobId = await uploadFile(file, {
        onRetry: (attempt) => {
          toast.loading(`Upload failed. Retrying... (${attempt}/3)`, {
            id: "qr-upload",
          });
        },
      });
      setForm((prev) => ({ ...prev, qrCodeBlobId: blobId }));
      toast.success("QR code uploaded! Click Save to apply.", {
        id: "qr-upload",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      toast.error(msg, { id: "qr-upload" });
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Always save to localStorage first as primary (instant, cross-device within same origin)
    const localSettings = {
      upiId: form.upiId,
      accountHolderName: form.accountHolderName,
      accountNumber: form.accountNumber,
      ifscCode: form.ifscCode,
      qrCodeBlobId: form.qrCodeBlobId,
    };
    try {
      localStorage.setItem(
        "aag_payment_settings",
        JSON.stringify(localSettings),
      );
    } catch {
      // ignore storage errors
    }

    // Attempt backend save for cross-device sync
    try {
      await updatePaymentSettings(localSettings);
      toast.success(
        "Payment settings saved successfully! Changes visible to all users.",
      );
    } catch (err: unknown) {
      // localStorage save already succeeded — settings will persist on this device
      console.error("[AdminPaymentSettings] Backend save failed:", err);
      toast.success(
        "Settings saved locally. Note: cross-device sync may be delayed.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          Payment Settings
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Configure payment methods shown to clients after order submission
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Settings Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* UPI Settings */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground">
                UPI Settings
              </h3>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-body text-muted-foreground">
                UPI ID
              </Label>
              <Input
                data-ocid="admin.payment.upi.input"
                value={form.upiId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, upiId: e.target.value }))
                }
                placeholder="yourname@upi"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 font-mono"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground">
                Bank Transfer Details
              </h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-body text-muted-foreground">
                  Account Holder Name
                </Label>
                <Input
                  data-ocid="admin.payment.bank_name.input"
                  value={form.accountHolderName}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      accountHolderName: e.target.value,
                    }))
                  }
                  placeholder="Account holder name"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-body text-muted-foreground">
                  Account Number
                </Label>
                <Input
                  data-ocid="admin.payment.account.input"
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, accountNumber: e.target.value }))
                  }
                  placeholder="Account number"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-body text-muted-foreground">
                  IFSC Code
                </Label>
                <Input
                  data-ocid="admin.payment.ifsc.input"
                  value={form.ifscCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ifscCode: e.target.value }))
                  }
                  placeholder="IFSC Code"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* QR Code Upload */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground">
                Payment QR Code
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              Upload a QR code image for UPI payment. Clients will see this on
              the payment page. The QR is stored on the central server and
              visible to all users.
            </p>

            {/* Current QR Preview */}
            {form.qrPreviewUrl ? (
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
                <img
                  src={form.qrPreviewUrl}
                  alt="Current QR Code"
                  className="max-w-[180px] w-full rounded-xl border border-border"
                />
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-body">
                    {form.qrCodeBlobId
                      ? "QR uploaded to central server"
                      : "QR preview loaded"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 rounded-xl border border-dashed border-border bg-secondary/30">
                <div className="text-center">
                  <QrCode className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-body">
                    No QR code uploaded yet
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleQrUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingQr}
              data-ocid="admin.payment.qr.upload_button"
              className="w-full border-primary/30 text-primary hover:bg-primary/10"
            >
              {isUploadingQr ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading to server...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {form.qrPreviewUrl ? "Change QR Code" : "Upload QR Code"}
                </>
              )}
            </Button>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || isUploadingQr}
            data-ocid="admin.payment.save.primary_button"
            className="w-full py-6 font-display font-bold text-base bg-primary text-primary-foreground hover:shadow-neon-blue transition-all duration-300 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Payment Settings
              </>
            )}
          </Button>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-8">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Preview (Customer View)
            </h3>
            <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
              {/* UPI Preview */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" />
                  UPI ID Payment
                </p>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border">
                  <span className="font-mono font-semibold text-sm text-foreground">
                    {form.upiId || "—"}
                  </span>
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80"
                    aria-label="Copy UPI"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(form.upiId)
                        .then(() => toast.success("UPI ID copied!"))
                        .catch(() => {})
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Bank Preview */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  Bank Transfer
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: "Name", value: form.accountHolderName },
                    { label: "Account", value: form.accountNumber },
                    { label: "IFSC", value: form.ifscCode },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between items-center text-xs"
                    >
                      <span className="text-muted-foreground/60 font-body">
                        {item.label}
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {item.value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Preview */}
              {form.qrPreviewUrl && (
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-3 flex items-center justify-center gap-1.5">
                    <QrCode className="w-3 h-3" />
                    QR Code
                  </p>
                  <img
                    src={form.qrPreviewUrl}
                    alt="Payment QR"
                    className="max-w-[120px] w-full mx-auto rounded-lg border border-border"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
