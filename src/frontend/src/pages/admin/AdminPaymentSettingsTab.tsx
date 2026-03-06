import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useUpdatePaymentSettings } from "../../hooks/useQueries";
import {
  type LocalPaymentSettings,
  getPaymentSettings,
  setPaymentSettings,
} from "../../utils/localData";

export default function AdminPaymentSettingsTab() {
  const [settings, setSettings] =
    useState<LocalPaymentSettings>(getPaymentSettings);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: updatePaymentSettings } = useUpdatePaymentSettings();

  useEffect(() => {
    setSettings(getPaymentSettings());
  }, []);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSettings((prev) => ({ ...prev, qrImageUrl: dataUrl }));
      toast.success("QR code image loaded. Click Save to apply.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      setPaymentSettings(settings);

      // Non-blocking backend update
      updatePaymentSettings({
        upiId: settings.upiId,
        accountHolderName: settings.accountHolderName,
        accountNumber: settings.accountNumber,
        ifscCode: settings.ifscCode,
        qrCodeBlobId: "", // QR stored as data URL in local only
      }).catch(() => {
        // silent – localStorage is source of truth for QR
      });

      toast.success("Payment settings saved successfully!");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

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
                value={settings.upiId}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, upiId: e.target.value }))
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
                  value={settings.accountHolderName}
                  onChange={(e) =>
                    setSettings((p) => ({
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
                  value={settings.accountNumber}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      accountNumber: e.target.value,
                    }))
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
                  value={settings.ifscCode}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, ifscCode: e.target.value }))
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
              the payment page.
            </p>

            {/* Current QR Preview */}
            {settings.qrImageUrl ? (
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
                <img
                  src={settings.qrImageUrl}
                  alt="Current QR Code"
                  className="max-w-[180px] w-full rounded-xl border border-border"
                />
                <span className="text-xs text-emerald-400 font-body">
                  QR code is set
                </span>
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
              accept="image/*"
              onChange={handleQrUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-ocid="admin.payment.qr.upload_button"
              className="w-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              {settings.qrImageUrl ? "Change QR Code" : "Upload QR Code"}
            </Button>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
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
                    {settings.upiId || "—"}
                  </span>
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80"
                    aria-label="Copy UPI"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(settings.upiId)
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
                    { label: "Name", value: settings.accountHolderName },
                    { label: "Account", value: settings.accountNumber },
                    { label: "IFSC", value: settings.ifscCode },
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
              {settings.qrImageUrl && (
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-3 flex items-center justify-center gap-1.5">
                    <QrCode className="w-3 h-3" />
                    QR Code
                  </p>
                  <img
                    src={settings.qrImageUrl}
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
