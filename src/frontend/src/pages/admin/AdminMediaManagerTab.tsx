import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileVideo,
  FolderOpen,
  Image as ImageIcon,
  Link,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBlobStorage, validateFile } from "../../hooks/useBlobStorage";
import { useCreatePortfolio } from "../../hooks/useQueries";
import {
  type MediaItem,
  type UploadError,
  addMediaItem,
  clearUploadErrors,
  deleteMediaItem,
  getMediaItems,
  getUploadErrors,
  replaceMediaItemBlobId,
} from "../../utils/localData";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isValidEmbedUrl(url: string): boolean {
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("drive.google.com")
  );
}

function extractEmbedTitle(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube") || u.hostname.includes("youtu.be")) {
      return "YouTube Video";
    }
    if (u.hostname.includes("drive.google.com")) {
      return "Google Drive Video";
    }
    return u.hostname;
  } catch {
    return "Embedded Video";
  }
}

// ─── Media Thumbnail ────────────────────────────────────────────────────────

function MediaThumbnail({ item }: { item: MediaItem }) {
  const { getFileUrl } = useBlobStorage();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (item.mediaType.startsWith("image/") || item.mediaType === "video/mp4") {
      getFileUrl(item.blobId)
        .then((url) => {
          if (!cancelled) setBlobUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [item.blobId, item.mediaType, getFileUrl]);

  // YouTube embed thumbnail
  if (item.mediaType === "video/embed") {
    const ytId = getYouTubeId(item.blobId);
    const thumbnailUrl = ytId
      ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
      : null;

    return (
      <div className="aspect-video rounded-lg overflow-hidden relative bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileVideo className="w-7 h-7 text-accent/40" />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-10 h-10 rounded-full bg-accent/80 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="absolute top-1.5 right-1.5">
          <Badge className="text-[8px] bg-accent/80 text-white border-0 font-body px-1.5 py-0.5">
            EMBED
          </Badge>
        </div>
      </div>
    );
  }

  // Image preview
  if (item.mediaType.startsWith("image/")) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden relative bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
        {blobUrl ? (
          <img
            src={blobUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-7 h-7 text-primary/40" />
        )}
      </div>
    );
  }

  // Video MP4 preview
  if (item.mediaType === "video/mp4") {
    return (
      <div className="aspect-video rounded-lg overflow-hidden relative bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center">
        {blobUrl ? (
          <video
            src={blobUrl}
            preload="metadata"
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <FileVideo className="w-7 h-7 text-accent/40" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
      <FileVideo className="w-7 h-7 text-muted-foreground/30" />
    </div>
  );
}

// ─── Upload Card ────────────────────────────────────────────────────────────

type UploadMode = "image" | "video";

interface UploadCardProps {
  mode: UploadMode;
  onUploaded: () => void;
  createPortfolioAsync: (data: {
    title: string;
    category: string;
    description: string;
    blobId: string;
    mediaType: string;
    serviceId: bigint | null;
  }) => Promise<bigint>;
}

function UploadCard({
  mode,
  onUploaded,
  createPortfolioAsync,
}: UploadCardProps) {
  const { uploadFile, uploadProgress, isUploading, retryCount } =
    useBlobStorage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [retryMsg, setRetryMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isImage = mode === "image";
  const accept = isImage
    ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
    : "video/mp4,.mp4";
  const maxLabel = isImage ? "10 MB" : "100 MB";
  const fmtLabel = isImage ? "JPG, JPEG, PNG, WEBP" : "MP4";

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.reason ?? "Invalid file.");
      setUploadState("error");
      return;
    }
    setSelectedFile(file);
    setUploadState("idle");
    setErrorMsg("");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.reason ?? "Invalid file.");
      setUploadState("error");
      return;
    }
    setSelectedFile(file);
    setUploadState("idle");
    setErrorMsg("");
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadState("uploading");
    setErrorMsg("");
    setRetryMsg("");

    try {
      const hash = await uploadFile(selectedFile, {
        onRetry: (attempt) => {
          setRetryMsg(`Upload failed. Retrying... (attempt ${attempt}/3)`);
        },
      });

      const newItem: MediaItem = {
        id: `media-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: selectedFile.name,
        blobId: hash,
        mediaType: selectedFile.type,
        size: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      };
      // Save to localStorage for immediate local display
      addMediaItem(newItem);

      // Also save to central backend so all devices can see it
      const category = selectedFile.type.startsWith("image/")
        ? "Images"
        : "Videos";
      try {
        await createPortfolioAsync({
          title: selectedFile.name,
          category,
          description: "",
          blobId: hash,
          mediaType: selectedFile.type,
          serviceId: null,
        });
      } catch {
        // Backend save failed silently — item still stored locally
      }

      setUploadState("success");
      setRetryMsg("");
      toast.success("Upload successful ✅");
      setSelectedFile(null);
      onUploaded();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Upload failed. Please check your file and try again.";
      setErrorMsg(msg);
      setRetryMsg("");
      setUploadState("error");
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadState("idle");
    setErrorMsg("");
    setRetryMsg("");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isImage
              ? "bg-primary/10 border border-primary/20"
              : "bg-accent/10 border border-accent/20"
          }`}
        >
          {isImage ? (
            <ImageIcon className="w-4 h-4 text-primary" />
          ) : (
            <FileVideo className="w-4 h-4 text-accent" />
          )}
        </div>
        <div>
          <p className="font-display font-semibold text-sm text-foreground">
            Upload {isImage ? "Image" : "Video"}
          </p>
          <p className="text-[10px] text-muted-foreground font-body">
            {fmtLabel} · max {maxLabel}
          </p>
        </div>
      </div>

      {/* Dropzone */}
      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        data-ocid={`admin.media.${mode}.dropzone`}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 w-full ${
          dragOver
            ? "border-primary/70 bg-primary/5"
            : selectedFile
              ? "border-primary/40 bg-primary/3"
              : "border-border hover:border-primary/40 hover:bg-primary/3"
        }`}
      >
        {selectedFile ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-sm font-body text-foreground font-medium truncate max-w-[180px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground font-body">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-muted-foreground/50" />
            <p className="text-xs font-body text-muted-foreground">
              Drag & drop or click to upload
            </p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          data-ocid={`admin.media.${mode}.upload_button`}
        />
      </button>

      {/* Progress bar */}
      {isUploading && (
        <div className="space-y-1.5">
          {retryMsg ? (
            <p className="text-xs font-body text-amber-400 flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3 animate-spin" />
              {retryMsg}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground font-body">
              Uploading... {uploadProgress}%
            </p>
          )}
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      {/* Retry indicator */}
      {retryCount > 0 && !isUploading && uploadState !== "error" && (
        <p className="text-xs font-body text-amber-400 flex items-center gap-1.5">
          <RotateCcw className="w-3 h-3" />
          Retry attempt {retryCount}/3...
        </p>
      )}

      {/* Success state */}
      {uploadState === "success" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          data-ocid={`admin.media.${mode}.success_state`}
          className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-body"
        >
          <span>✅</span> Upload successful!
        </motion.div>
      )}

      {/* Error state */}
      {uploadState === "error" && errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          data-ocid={`admin.media.${mode}.error_state`}
          className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-body"
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {errorMsg.includes("Upload failed")
            ? "Upload failed. Please check your file and try again."
            : errorMsg}
        </motion.div>
      )}

      {/* Upload button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        data-ocid={`admin.media.${mode}.submit_button`}
        className={`w-full font-display font-semibold ${
          isImage
            ? "bg-primary text-primary-foreground hover:shadow-neon-blue-sm"
            : "bg-accent text-accent-foreground hover:shadow-neon-purple-sm"
        } transition-all disabled:opacity-40`}
      >
        {isUploading ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Uploading...
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Upload className="w-4 h-4" />
            Upload {isImage ? "Image" : "Video"}
          </span>
        )}
      </Button>
    </div>
  );
}

// ─── URL Embed Card ──────────────────────────────────────────────────────────

function UrlEmbedCard({
  onAdded,
  createPortfolioAsync,
}: {
  onAdded: () => void;
  createPortfolioAsync: (data: {
    title: string;
    category: string;
    description: string;
    blobId: string;
    mediaType: string;
    serviceId: bigint | null;
  }) => Promise<bigint>;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleAdd = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL.");
      return;
    }
    if (!isValidEmbedUrl(trimmed)) {
      setError(
        "Only YouTube (youtube.com, youtu.be) or Google Drive URLs are supported.",
      );
      return;
    }

    const newItem: MediaItem = {
      id: `embed-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: extractEmbedTitle(trimmed),
      blobId: trimmed,
      mediaType: "video/embed",
      size: 0,
      uploadedAt: new Date().toISOString(),
    };
    // Save to localStorage for immediate local display
    addMediaItem(newItem);

    // Also save to central backend so all devices can see it
    try {
      await createPortfolioAsync({
        title: extractEmbedTitle(trimmed),
        category: "Videos",
        description: "",
        blobId: `embed::${trimmed}`,
        mediaType: "video/embed",
        serviceId: null,
      });
    } catch {
      // Backend save failed silently — item still stored locally
    }

    setSuccess(true);
    setUrl("");
    setError("");
    toast.success("Embed added successfully");
    onAdded();

    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
          <Link className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="font-display font-semibold text-sm text-foreground">
            Add URL Embed
          </p>
          <p className="text-[10px] text-muted-foreground font-body">
            YouTube · Google Drive
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
            setSuccess(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Paste YouTube or Google Drive URL..."
          data-ocid="admin.media.embed.input"
          className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground/40 text-sm"
        />
        <Button
          onClick={handleAdd}
          data-ocid="admin.media.embed.submit_button"
          className="bg-emerald-600 text-white hover:bg-emerald-500 font-display font-semibold shrink-0"
        >
          Add Embed
        </Button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-ocid="admin.media.embed.error_state"
            className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-body"
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-ocid="admin.media.embed.success_state"
            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-body"
          >
            <span>✅</span> Embed added successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Replace Button ─────────────────────────────────────────────────────────

function ReplaceButton({
  item,
  onReplaced,
}: {
  item: MediaItem;
  onReplaced: () => void;
}) {
  const { uploadFile, isUploading } = useBlobStorage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState(false);

  const accept = item.mediaType.startsWith("image/")
    ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
    : "video/mp4,.mp4";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(
        validation.reason ?? "Upload failed. Please check file type and size.",
      );
      return;
    }

    setReplacing(true);
    try {
      const hash = await uploadFile(file, {
        onRetry: (attempt) => {
          toast.message(`Upload failed. Retrying... (attempt ${attempt}/3)`);
        },
      });
      replaceMediaItemBlobId(item.id, hash);
      toast.success("File replaced successfully ✅");
      onReplaced();
    } catch {
      toast.error("Upload failed. Please check your file and try again.");
    } finally {
      setReplacing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={replacing || isUploading}
        data-ocid="admin.media.replace.button"
        title="Replace file"
        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
      >
        {replacing ? (
          <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin block" />
        ) : (
          <RefreshCw className="w-3 h-3" />
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}

// ─── Media Grid ─────────────────────────────────────────────────────────────

function MediaGrid() {
  const [items, setItems] = useState<MediaItem[]>(() => getMediaItems());
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const refresh = () => setItems(getMediaItems());

  const handleDelete = (id: string) => {
    deleteMediaItem(id);
    refresh();
    toast.success("Media item removed.");
  };

  const filtered = items.filter((item) => {
    if (filter === "image") return item.mediaType.startsWith("image/");
    if (filter === "video")
      return (
        item.mediaType.startsWith("video/") || item.mediaType === "video/embed"
      );
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="bg-secondary border border-border h-9">
          <TabsTrigger
            value="all"
            data-ocid="admin.media.all.tab"
            className="text-xs font-body"
          >
            All ({items.length})
          </TabsTrigger>
          <TabsTrigger
            value="image"
            data-ocid="admin.media.images.tab"
            className="text-xs font-body"
          >
            Images (
            {items.filter((i) => i.mediaType.startsWith("image/")).length})
          </TabsTrigger>
          <TabsTrigger
            value="video"
            data-ocid="admin.media.videos.tab"
            className="text-xs font-body"
          >
            Videos (
            {
              items.filter(
                (i) =>
                  i.mediaType.startsWith("video/") ||
                  i.mediaType === "video/embed",
              ).length
            }
            )
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {sorted.length === 0 ? (
            <div
              data-ocid="admin.media.empty_state"
              className="text-center py-14 border border-dashed border-border rounded-xl"
            >
              <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-body">
                No media items yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {sorted.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.04 }}
                    data-ocid={`admin.media.item.${i + 1}`}
                    className="rounded-xl border border-border bg-card p-3 hover:border-primary/30 transition-all group"
                  >
                    {/* Thumbnail */}
                    <MediaThumbnail item={item} />

                    <div className="space-y-1.5 mt-3">
                      <p className="text-xs font-display font-semibold text-foreground truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className="text-[9px] font-body bg-primary/10 text-primary border border-primary/20">
                          {item.mediaType.startsWith("image/")
                            ? "Image"
                            : item.mediaType === "video/embed"
                              ? "Embed"
                              : "Video"}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground font-body">
                          {formatBytes(item.size)}
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground/60 font-body">
                        {formatDate(item.uploadedAt)}
                      </p>

                      {/* Actions row */}
                      <div className="flex items-center gap-1 mt-1 pt-1 border-t border-border/40">
                        {/* Replace — only for real files, not embeds */}
                        {item.mediaType !== "video/embed" && (
                          <ReplaceButton item={item} onReplaced={refresh} />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          data-ocid={`admin.media.delete_button.${i + 1}`}
                          className="flex-1 h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Error Log ──────────────────────────────────────────────────────────────

function UploadErrorLog() {
  const [expanded, setExpanded] = useState(false);
  const [errors, setErrors] = useState<UploadError[]>(() => getUploadErrors());

  const handleClear = () => {
    clearUploadErrors();
    setErrors([]);
    toast.success("Upload error log cleared.");
  };

  const refresh = () => setErrors(getUploadErrors());

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => {
          setExpanded((v) => !v);
          if (!expanded) refresh();
        }}
        data-ocid="admin.media.error_log.toggle"
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="font-display font-semibold text-sm text-foreground">
            Upload Error Log
          </span>
          {errors.length > 0 && (
            <Badge className="text-[9px] bg-destructive/10 text-destructive border border-destructive/20">
              {errors.length}
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border">
              {errors.length === 0 ? (
                <p
                  data-ocid="admin.media.error_log.empty_state"
                  className="text-sm text-muted-foreground font-body py-6 text-center"
                >
                  No upload errors.
                </p>
              ) : (
                <>
                  <div className="flex justify-end pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClear}
                      data-ocid="admin.media.error_log.delete_button"
                      className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear Log
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {errors.map((err, i) => (
                      <div
                        key={err.id}
                        data-ocid={`admin.media.error_log.item.${i + 1}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/15"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-display font-semibold text-foreground truncate">
                            {err.fileName}
                          </p>
                          <p className="text-[10px] text-destructive/80 font-body mt-0.5">
                            {err.reason}
                          </p>
                          <p className="text-[9px] text-muted-foreground/50 font-body mt-0.5">
                            {formatDate(err.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Tab ────────────────────────────────────────────────────────────────

export default function AdminMediaManagerTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { mutateAsync: createPortfolioAsync } = useCreatePortfolio();

  const handleUploaded = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          Media Manager
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Upload, manage, and track all media assets
        </p>
      </div>

      {/* Upload Cards + Embed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UploadCard
          mode="image"
          onUploaded={handleUploaded}
          createPortfolioAsync={createPortfolioAsync}
        />
        <UploadCard
          mode="video"
          onUploaded={handleUploaded}
          createPortfolioAsync={createPortfolioAsync}
        />
      </div>

      {/* URL Embed Card */}
      <UrlEmbedCard
        onAdded={handleUploaded}
        createPortfolioAsync={createPortfolioAsync}
      />

      {/* Media Grid */}
      <div key={refreshKey}>
        <h3 className="font-display font-semibold text-base text-foreground mb-4">
          All Media
        </h3>
        <MediaGrid />
      </div>

      {/* Error Log */}
      <UploadErrorLog />
    </div>
  );
}
