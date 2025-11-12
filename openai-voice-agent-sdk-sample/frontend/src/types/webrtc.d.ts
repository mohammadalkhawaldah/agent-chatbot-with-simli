interface SimliAudioDataInit {
  format: string;
  sampleRate: number;
  numberOfFrames: number;
  numberOfChannels: number;
  timestamp: number;
  data: BufferSource;
}

declare class AudioData {
  constructor(init: SimliAudioDataInit);
  readonly numberOfChannels: number;
  readonly numberOfFrames: number;
  readonly sampleRate: number;
  readonly duration: number;
  readonly timestamp: number;
  close(): void;
}

declare class MediaStreamTrackGenerator<TKind extends "audio" | "video"> extends MediaStreamTrack {
  readonly kind: TKind;
  readonly writable: WritableStream<TKind extends "audio" ? AudioData : VideoFrame>;
  constructor(init: { kind: TKind });
}
