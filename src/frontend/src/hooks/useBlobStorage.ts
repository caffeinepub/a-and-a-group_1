import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { addUploadError } from "../utils/localData";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── Constants ─────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

const ALLOWED_VIDEO_TYPES = ["video/mp4"];
const ALLOWED_VIDEO_EXTS = [".mp4"];

const BLOCKED_EXTS = [
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".msi",
  ".php",
  ".py",
  ".rb",
  ".dll",
  ".apk",
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

// ─── Helpers ───────────────────────────────────────────────────────────────

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx === -1) return "";
  return fileName.slice(idx).toLowerCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Exported Validator ────────────────────────────────────────────────────

export function validateFile(file: File): { valid: boolean; reason?: string } {
  const ext = getExtension(file.name);

  // Block unsafe extensions first
  if (BLOCKED_EXTS.includes(ext)) {
    return { valid: false, reason: `File type "${ext}" is not allowed.` };
  }

  const isImage =
    ALLOWED_IMAGE_TYPES.includes(file.type) || ALLOWED_IMAGE_EXTS.includes(ext);
  const isVideo =
    ALLOWED_VIDEO_TYPES.includes(file.type) || ALLOWED_VIDEO_EXTS.includes(ext);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      reason: "Upload failed. Please check file type and size.",
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      reason: `Image exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`,
    };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      reason: `Video exceeds 100MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`,
    };
  }

  return { valid: true };
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useBlobStorage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const uploadFile = useCallback(
    async (
      file: File,
      options?: { onRetry?: (attempt: number) => void },
    ): Promise<string> => {
      if (!actor) throw new Error("Actor not available");

      // Validate file before attempting upload
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(
          validation.reason ??
            "Upload failed. Please check file type and size.",
        );
      }

      setIsUploading(true);
      setUploadProgress(0);
      setRetryCount(0);

      let lastError: Error = new Error("Upload failed.");

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const config = await loadConfig();
          const agentOptions: Parameters<typeof HttpAgent.create>[0] = {};
          if (identity) {
            agentOptions.identity = identity;
          }
          const agent = await HttpAgent.create(agentOptions);

          const storageClient = new StorageClient(
            "portfolio",
            config.storage_gateway_url,
            config.backend_canister_id,
            config.project_id,
            agent,
          );

          const bytes = new Uint8Array(await file.arrayBuffer());
          const { hash } = await storageClient.putFile(bytes, (pct) => {
            setUploadProgress(pct);
          });

          setIsUploading(false);
          setUploadProgress(0);
          setRetryCount(0);
          return hash;
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error("Upload failed.");

          if (attempt < MAX_RETRIES) {
            setRetryCount(attempt);
            options?.onRetry?.(attempt);
            await sleep(RETRY_DELAY_MS);
          }
        }
      }

      // All retries exhausted — log error
      setIsUploading(false);
      setUploadProgress(0);
      setRetryCount(0);

      addUploadError({
        id: `err-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileName: file.name,
        reason: lastError.message,
        timestamp: new Date().toISOString(),
      });

      throw lastError;
    },
    [actor, identity],
  );

  const getFileUrl = useCallback(async (hash: string): Promise<string> => {
    const config = await loadConfig();
    const agent = await HttpAgent.create({});
    const storageClient = new StorageClient(
      "portfolio",
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent,
    );
    return storageClient.getDirectURL(hash);
  }, []);

  return { uploadFile, getFileUrl, uploadProgress, isUploading, retryCount };
}
