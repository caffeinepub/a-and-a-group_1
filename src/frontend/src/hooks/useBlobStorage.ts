import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useBlobStorage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      if (!actor) throw new Error("Actor not available");

      setIsUploading(true);
      setUploadProgress(0);

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

        return hash;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
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

  return { uploadFile, getFileUrl, uploadProgress, isUploading };
}
