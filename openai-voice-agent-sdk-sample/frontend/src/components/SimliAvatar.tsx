"use client";

import clsx from "clsx";

import { Button } from "@/components/ui/Button";

interface SimliAvatarProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  status: "disabled" | "idle" | "connecting" | "connected" | "error";
  error?: string | null;
  onReconnect: () => void;
}

export function SimliAvatar({ videoRef, status, error, onReconnect }: SimliAvatarProps) {
  const isError = status === "error";
  const isConnecting = status === "connecting";
  const isDisabled = status === "disabled";

  return (
    <div className="flex flex-col gap-3">
      <div
        className={clsx(
          "relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg",
          "aspect-[3/4] w-full max-w-xs self-center sm:self-start"
        )}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          playsInline
          muted
        />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white/70">
          <span>
            {isDisabled && "Simli avatar disabled"}
            {isConnecting && "Connecting to Simli avatar..."}
            {status === "connected" && "Avatar connected"}
            {isError && "Avatar connection lost"}
            {status === "idle" && "Avatar ready"}
          </span>
          {isError && (
            <Button size="sm" variant="outline" onClick={onReconnect}>
              Retry
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
