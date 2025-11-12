"use client";

import AudioChat from "@/components/AudioChat";
import { ChatHistory } from "@/components/ChatDialog";
import { Composer } from "@/components/Composer";
import { Header } from "@/components/Header";
import { SimliAvatar } from "@/components/SimliAvatar";
import { useAudio } from "@/hooks/useAudio";
import { useSimliAvatar } from "@/hooks/useSimliAvatar";
import { useWebsocket } from "@/hooks/useWebsocket";
import { useCallback, useEffect, useState } from "react";

import "./styles.css";

export default function Home() {
  const [prompt, setPrompt] = useState("");

  const {
    isReady: audioIsReady,
    playAudio,
    startRecording,
    stopRecording,
    stopPlaying,
    frequencies,
    playbackFrequencies,
  } = useAudio();
  const {
    status: avatarStatus,
    error: avatarError,
    videoRef,
    connect: connectAvatar,
    sendPcmChunk,
    isEnabled: avatarEnabled,
  } = useSimliAvatar();
  const {
    isReady: websocketReady,
    sendAudioMessage,
    sendTextMessage,
    history: messages,
    resetHistory,
    isLoading,
    agentName,
  } = useWebsocket({
    onNewAudio: useCallback(
      (audio) => {
        playAudio(audio);
        void sendPcmChunk(audio);
      },
      [playAudio, sendPcmChunk]
    ),
  });

  useEffect(() => {
    if (avatarEnabled && audioIsReady && websocketReady) {
      void connectAvatar();
    }
  }, [avatarEnabled, audioIsReady, connectAvatar, websocketReady]);

  function handleSubmit() {
    setPrompt("");
    sendTextMessage(prompt);
  }

  async function handleStopPlaying() {
    await stopPlaying();
  }

  return (
    <div className="w-full h-dvh flex flex-col items-center">
      <h1 className="text-3xl font-bold text-center mt-8 mb-4">
        LOZI CORE AI SCHOOL ASSISTANT
      </h1>
      <Header
        agentName={agentName ?? ""}
        playbackFrequencies={playbackFrequencies}
        stopPlaying={handleStopPlaying}
        resetConversation={resetHistory}
      />
      <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-6">
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,280px)_1fr]">
          {avatarEnabled && (
            <SimliAvatar
              videoRef={videoRef}
              status={avatarStatus}
              error={avatarError}
              onReconnect={() => {
                void connectAvatar();
              }}
            />
          )}
          <ChatHistory messages={messages} isLoading={isLoading} />
        </div>
      </div>
      <Composer
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        audioChat={
          <AudioChat
            frequencies={frequencies}
            isReady={websocketReady && audioIsReady}
            startRecording={startRecording}
            stopRecording={stopRecording}
            sendAudioMessage={sendAudioMessage}
          />
        }
      />
    </div>
  );
}
