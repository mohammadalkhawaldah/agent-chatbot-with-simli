#!/bin/bash

# Deployment helper script for Render - SINGLE SERVICE DEPLOYMENT
# This script helps set up environment variables for cost-effective deployment

echo "🚀 Voice Agent Chatbot - Render Deployment Helper (COST-EFFECTIVE)"
echo "=================================================================="

echo ""
echo "� SINGLE SERVICE DEPLOYMENT - Saves 50% on hosting costs!"
echo "   Instead of 2 services ($14/month), you now deploy 1 service ($7/month)"

echo ""
echo "�📝 Before deploying to Render, make sure you have:"
echo "1. ✅ OpenAI API Key"
echo "2. ✅ GitHub repository connected to Render"
echo "3. ✅ render.yaml file in your repository root"
echo "4. ✅ combined_server.py file in openai-voice-agent-sdk-sample/"

echo ""
echo "🔧 Environment Variables Needed:"
echo "--------------------------------"
echo "ONLY ONE SERVICE - Combined Frontend + Backend:"
echo "  OPENAI_API_KEY=your_openai_api_key_here"
echo "  PYTHON_VERSION=3.11.0"

echo ""
echo "🌐 Deployment URL will be (SINGLE SERVICE):"
echo "  Combined App: https://voice-agent-app-[hash].onrender.com"
echo "  Frontend:     https://voice-agent-app-[hash].onrender.com/"
echo "  API:          https://voice-agent-app-[hash].onrender.com/api/"
echo "  WebSocket:    wss://voice-agent-app-[hash].onrender.com/ws"
echo "  Health:       https://voice-agent-app-[hash].onrender.com/health"

echo ""
echo "🎯 Repository: https://github.com/mohammadalkhawaldah/Lozi-Core-Schools-Assistant-2"

echo ""
echo "🚀 DEPLOYMENT STEPS (FREE WEB SERVICE):"
echo "======================================="
echo "1. Go to render.com"
echo "2. New → Web Service (FREE)"
echo "3. Connect your GitHub repo"
echo "4. Configure manually (see below)"
echo "5. Deploy!"

echo ""
echo "📋 WEB SERVICE CONFIGURATION:"
echo "=============================="
echo "Name: voice-agent-app"
echo "Runtime: Python 3"
echo "Build Command:"
echo "  cd openai-voice-agent-sdk-sample && ./build.sh"
echo ""
echo "Start Command:"
echo "  cd openai-voice-agent-sdk-sample && python combined_server.py"
echo ""
echo "Environment Variables:"
echo "  OPENAI_API_KEY = your_openai_api_key_here"
echo "  PYTHON_VERSION = 3.11.0"

echo ""
echo "🔧 ALTERNATIVE SIMPLE APPROACH:"
echo "==============================="
echo "If the above fails, try this simpler configuration:"
echo "Runtime: Python 3"
echo "Build Command: cd openai-voice-agent-sdk-sample/server && pip install -e ."
echo "Start Command: cd openai-voice-agent-sdk-sample/server && uvicorn server:app --host 0.0.0.0 --port \$PORT"
echo ""
echo "⚠️  Note: This will only run the backend API (no frontend)"
echo "You can access the API at /docs for testing"

echo ""
read -p "Press Enter to continue..."
