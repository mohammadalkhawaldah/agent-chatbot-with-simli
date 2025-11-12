# Deployment Guide for Render

This guide will help you deploy the Voice Agent Chatbot to Render.

## Prerequisites

1. A Render account (https://render.com)
2. Your GitHub repository pushed to GitHub
3. OpenAI API key

## Deployment Options

### Option 1: Using render.yaml (Recommended)

1. **Connect Repository to Render:**
   - Go to your Render dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository: `https://github.com/mohammadalkhawaldah/Lozi-Core-Schools-Assistant-2`
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables:**
   - Set `OPENAI_API_KEY` in the backend service environment variables
   - The frontend will automatically get the backend URL from the service connection

### Option 2: Manual Service Creation

#### Backend Service (FastAPI)

1. **Create Web Service:**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `voice-agent-backend`
     - **Runtime:** Python 3
     - **Build Command:** `cd server && pip install -e .`
     - **Start Command:** `cd server && uvicorn server:app --host 0.0.0.0 --port $PORT`
     - **Root Directory:** Leave empty (uses project root)

2. **Environment Variables:**
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SIMLI_API_KEY`: Simli REST API key used to relay WebRTC offers
   - `SIMLI_AVATAR_ID`: Identifier of the Simli avatar to render
   - `SIMLI_VOICE_ID` *(optional)*: Override the default Simli voice for the avatar
   - `SIMLI_OFFER_ENDPOINT` *(optional)*: Custom Simli offer URL when not using the default `https://api.simli.com/v1`
   - `PYTHON_VERSION`: 3.11.0

#### Frontend Service (Next.js)

1. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect the same repository
   - Configure:
     - **Name:** `voice-agent-frontend`
     - **Runtime:** Node
     - **Build Command:** `cd frontend && npm install && npm run build`
     - **Start Command:** `cd frontend && npm start`
     - **Root Directory:** Leave empty

2. **Environment Variables:**
   - `NEXT_PUBLIC_WEBSOCKET_ENDPOINT`: `wss://[your-backend-url]/ws`
   - `NEXT_PUBLIC_SIMLI_AVATAR_ID`: Same value as `SIMLI_AVATAR_ID`
   - `NEXT_PUBLIC_SIMLI_VOICE_ID` *(optional)*: Matches the backend voice override when used
   - `NEXT_PUBLIC_SIMLI_OFFER_URL` *(optional)*: Base HTTP URL for the backend Simli relay (defaults to backend host)
   - Replace `[your-backend-url]` with your backend service URL

## Important Notes

1. **Free Tier Limitations:**
   - Render's free tier services go to sleep after 15 minutes of inactivity
   - Consider upgrading to paid plans for production use

2. **WebSocket Configuration:**
   - Make sure to use `wss://` (secure WebSocket) for HTTPS deployments
   - Update the frontend environment variable after backend deployment

3. **API Keys:**
   - Never commit API keys to your repository
   - Always use Render's environment variables feature

## Troubleshooting

1. **Build Failures:**
   - Check build logs in Render dashboard
   - Ensure all dependencies are correctly specified

2. **WebSocket Connection Issues:**
   - Verify the backend URL is correctly set in frontend environment
   - Check that both services are running

3. **Python Version Issues:**
   - Ensure Python 3.11+ is specified in environment variables

## Post-Deployment

After successful deployment:
1. Test the WebSocket connection
2. Verify voice functionality works
3. Check OpenAI API integration
4. Monitor logs for any issues

Your services will be available at:
- Backend: `https://voice-agent-backend-[hash].onrender.com`
- Frontend: `https://voice-agent-frontend-[hash].onrender.com`
