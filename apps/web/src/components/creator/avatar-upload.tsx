"use client";

import { useRef, useState, useCallback } from "react";
import { Loader2, Camera, X } from "lucide-react";
import { CreatorAvatar } from "./creator-avatar";

interface Props {
  currentCID?: string;
  name?: string;
  onCIDReady: (cid: string) => void;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export function AvatarUpload({ currentCID, name, onCIDReady }: Props) {
  const inputRef                      = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setErrorMsg(null);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadState("uploading");

      try {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? "Upload failed");
        }

        onCIDReady(json.cid);
        setUploadState("done");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed. Try again.";
        setErrorMsg(msg);
        setUploadState("error");
        setPreviewUrl(null);
      }
    },
    [onCIDReady],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const clear = useCallback(() => {
    setPreviewUrl(null);
    setUploadState("idle");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const displayCID = uploadState === "done" && !previewUrl ? currentCID : undefined;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar preview */}
      <div className="relative">
        {previewUrl ? (
          <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
            {uploadState === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-5 h-5 text-white animate-spin" aria-label="Uploading" />
              </div>
            )}
            {uploadState !== "uploading" && (
              <button
                type="button"
                onClick={clear}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        ) : (
          <CreatorAvatar avatarCID={displayCID} name={name ?? ""} size="lg" />
        )}

        {/* Camera badge */}
        {uploadState !== "uploading" && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="Upload avatar photo"
          >
            <Camera className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        )}
      </div>

      {/* Drop-zone label */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Choose avatar image"
      >
        {uploadState === "uploading"
          ? "Uploading to IPFS…"
          : uploadState === "done"
          ? "✓ Uploaded"
          : "Add a photo (optional)"}
      </button>

      {/* Error */}
      {errorMsg && (
        <p role="alert" className="text-xs text-destructive text-center">{errorMsg}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleChange}
      />
    </div>
  );
}
