import time
from collections.abc import AsyncIterator
from logging import getLogger
from typing import Any, Dict

# Import core agent and voice pipeline logic
from agents import Runner, trace
from agents.voice import (
    TTSModelSettings,
    VoicePipeline,
    VoicePipelineConfig,
    VoiceWorkflowBase,
)
# Import configuration and utility functions
from app.agent_config import starting_agent
from app.utils import (
    WebsocketHelper,
    concat_audio_chunks,
    extract_audio_chunk,
    is_audio_complete,
    is_new_audio_chunk,
    is_new_text_message,
    is_sync_message,
    is_text_output,
    process_inputs,
)
# FastAPI and middleware imports
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse

# Load environment variables from .env file
from dotenv import load_dotenv
# When .env file is present, it will override the environment variables
load_dotenv(dotenv_path="../.env", override=True)

# Create FastAPI app instance
app = FastAPI()

logger = getLogger(__name__)

# Enable CORS for all origins (for frontend-backend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# VoiceWorkflowBase subclass to handle user input and agent response
class Workflow(VoiceWorkflowBase):
    def __init__(self, connection: WebsocketHelper):
        self.connection = connection

    # Main method to process text input and stream agent responses
    async def run(self, input_text: str) -> AsyncIterator[str]:
        # Get conversation history and latest agent
        conversation_history, latest_agent = await self.connection.show_user_input(
            input_text
        )

        # Run the agent and stream output events
        output = Runner.run_streamed(
            latest_agent,
            conversation_history,
        )

        async for event in output.stream_events():
            await self.connection.handle_new_item(event)

            if is_text_output(event):
                yield event.data.delta  # type: ignore

        await self.connection.text_output_complete(output, is_done=True)

# WebSocket endpoint for real-time chat and audio
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    with trace("Voice Agent Chat"):
        await websocket.accept()
        # Create a new WebsocketHelper for each connection
        connection = WebsocketHelper(websocket, [], starting_agent)
        audio_buffer = []

        workflow = Workflow(connection)
        while True:
            try:
                message = await websocket.receive_json()
            except WebSocketDisconnect:
                print("Client disconnected")
                return

            # Handle text-based messages (sync, new text, etc.)
            if is_sync_message(message):
                connection.history = message["inputs"]
                if message.get("reset_agent", False):
                    connection.latest_agent = starting_agent
            elif is_new_text_message(message):
                user_input = process_inputs(message, connection)
                async for new_output_tokens in workflow.run(user_input):
                    await connection.stream_response(new_output_tokens, is_text=True)

            # Handle incoming audio chunks
            elif is_new_audio_chunk(message):
                audio_buffer.append(extract_audio_chunk(message))

            # When audio is complete, process and send response
            elif is_audio_complete(message):
                start_time = time.perf_counter()

                # Function to print time to first byte for debugging
                def transform_data(data):
                    nonlocal start_time
                    if start_time:
                        print(
                            f"Time taken to first byte: {time.perf_counter() - start_time}s"
                        )
                        start_time = None
                    return data

                audio_input = concat_audio_chunks(audio_buffer)
                output = await VoicePipeline(
                    workflow=workflow,
                    config=VoicePipelineConfig(
                        tts_settings=TTSModelSettings(
                            buffer_size=512, transform_data=transform_data
                        )
                    ),
                ).run(audio_input)
                async for event in output.stream():
                    await connection.send_audio_chunk(event)

                audio_buffer = []  # reset the audio buffer

# Entry point for running the server locally
if __name__ == "__main__":
    import uvicorn

    # Start FastAPI app with Uvicorn (hot reload enabled)
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
