import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AvatarStatus = "disabled" | "idle" | "connecting" | "connected" | "error";

interface UseSimliAvatarOptions {
  offerEndpoint?: string;
  avatarId?: string;
  voiceId?: string;
  sessionName?: string;
}

interface UseSimliAvatarResult {
  status: AvatarStatus;
  error: string | null;
  isEnabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendPcmChunk: (chunk: Int16Array<ArrayBuffer>) => Promise<void>;
}

function deriveBackendBaseUrl(): string {
  if (typeof window === "undefined") {
    return "http://localhost:8000";
  }

  const explicit = process.env.NEXT_PUBLIC_SIMLI_OFFER_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const wsEndpoint = process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT;
  if (wsEndpoint) {
    const url = new URL(wsEndpoint.replace(/^ws/, "http"));
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  }

  const { protocol, host } = window.location;
  const backendProtocol = protocol === "https:" ? "https" : "http";
  return `${backendProtocol}://${host}`;
}

function waitForIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    function checkState() {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }
    }
    pc.addEventListener("icegatheringstatechange", checkState);
  });
}

export function useSimliAvatar(options: UseSimliAvatarOptions = {}): UseSimliAvatarResult {
  const [status, setStatus] = useState<AvatarStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<AudioData> | null>(null);
  const timestampRef = useRef<number>(0);
  const audioCtorRef = useRef<typeof AudioData | null>(null);
  const trackGeneratorRef = useRef<MediaStreamTrackGenerator<"audio"> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isEnabled = useMemo(() => {
    return Boolean(process.env.NEXT_PUBLIC_SIMLI_AVATAR_ID || options.avatarId);
  }, [options.avatarId]);

  const offerEndpoint = useMemo(() => {
    const base = options.offerEndpoint ?? `${deriveBackendBaseUrl()}`;
    return `${base}/simli/offer`;
  }, [options.offerEndpoint]);

  const avatarId = options.avatarId ?? process.env.NEXT_PUBLIC_SIMLI_AVATAR_ID ?? undefined;
  const voiceId = options.voiceId ?? process.env.NEXT_PUBLIC_SIMLI_VOICE_ID ?? undefined;
  const sessionName = options.sessionName ?? "voice-agent-session";

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioCtorRef.current = (window as unknown as { AudioData?: typeof AudioData }).AudioData ?? null;
    }
  }, []);

  const disconnect = useCallback(
    (nextStatus?: AvatarStatus) => {
      writerRef.current?.close().catch(() => undefined);
      writerRef.current = null;
      trackGeneratorRef.current?.stop();
      trackGeneratorRef.current = null;
      timestampRef.current = 0;
      pcRef.current?.close();
      pcRef.current = null;
      setStatus(nextStatus ?? (isEnabled ? "idle" : "disabled"));
    },
    [isEnabled]
  );

  const connect = useCallback(async () => {
    if (!isEnabled) {
      setStatus("disabled");
      return;
    }

    if (pcRef.current) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const AudioDataCtor = audioCtorRef.current;
    if (!AudioDataCtor) {
      setStatus("error");
      setError("AudioData API is not available in this browser.");
      return;
    }

    const GeneratorCtor = (window as unknown as {
      MediaStreamTrackGenerator?: typeof MediaStreamTrackGenerator;
    }).MediaStreamTrackGenerator;

    if (!GeneratorCtor) {
      setStatus("error");
      setError("MediaStreamTrackGenerator API is not available in this browser.");
      return;
    }

    setStatus("connecting");
    setError(null);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pcRef.current = pc;

    const generator = new GeneratorCtor({ kind: "audio" });
    trackGeneratorRef.current = generator;

    const writer = generator.writable.getWriter();
    writerRef.current = writer;

    const outboundStream = new MediaStream();
    outboundStream.addTrack(generator);
    pc.addTrack(generator, outboundStream);

    pc.addTransceiver("video", { direction: "recvonly" });

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setError("Connection to Simli avatar was lost.");
        disconnect("error");
      } else if (pc.connectionState === "connected") {
        setStatus("connected");
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGatheringComplete(pc);

      const sdp = pc.localDescription?.sdp;
      if (!sdp) {
        throw new Error("Failed to build local SDP offer");
      }

      const response = await fetch(offerEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sdp,
          avatar_id: avatarId,
          voice_id: voiceId,
          session_name: sessionName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Simli offer failed with status ${response.status}`);
      }

      const data = (await response.json()) as { sdp?: string };
      if (!data.sdp) {
        throw new Error("Simli offer response did not include an SDP answer");
      }

      await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
      setStatus("connected");
    } catch (err) {
      console.error("Failed to set up Simli avatar", err);
      setError(err instanceof Error ? err.message : "Unknown Simli error");
      disconnect("error");
    }
  }, [avatarId, disconnect, isEnabled, offerEndpoint, sessionName, voiceId]);

  const sendPcmChunk = useCallback(
    async (chunk: Int16Array<ArrayBuffer>) => {
      if (!writerRef.current || status !== "connected") {
        return;
      }

      const AudioDataCtor = audioCtorRef.current;
      if (!AudioDataCtor) {
        return;
      }

      let buffer: ArrayBuffer;
      if (chunk instanceof Int16Array) {
        buffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
      } else if (chunk instanceof ArrayBuffer) {
        buffer = chunk;
      } else {
        buffer = new Int16Array(chunk as unknown as ArrayBufferLike).buffer;
      }

      const numberOfFrames = buffer.byteLength / Int16Array.BYTES_PER_ELEMENT;
      if (numberOfFrames === 0) {
        return;
      }

      const audioData = new AudioDataCtor({
        format: "s16",
        sampleRate: 24000,
        numberOfFrames,
        numberOfChannels: 1,
        timestamp: timestampRef.current,
        data: buffer,
      });

      timestampRef.current += Math.round((numberOfFrames / 24000) * 1_000_000);

      await writerRef.current.write(audioData);
      audioData.close();
    },
    [status]
  );

  useEffect(() => {
    if (!isEnabled) {
      setStatus("disabled");
    }

    return () => {
      disconnect();
    };
  }, [disconnect, isEnabled]);

  return {
    status,
    error,
    isEnabled,
    videoRef,
    connect,
    disconnect: () => disconnect(),
    sendPcmChunk,
  };
}
