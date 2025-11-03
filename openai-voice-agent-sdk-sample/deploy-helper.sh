#!/bin/bash

# Deployment helper script for Render
# This script helps set up environment variables for deployment

echo "🚀 Voice Agent Chatbot - Render Deployment Helper"
echo "================================================="

echo ""
echo "📝 Before deploying to Render, make sure you have:"
echo "1. ✅ OpenAI API Key"
echo "2. ✅ GitHub repository connected to Render"
echo "3. ✅ render.yaml file in your repository"

echo ""
echo "🔧 Environment Variables Needed:"
echo "--------------------------------"
echo "Backend Service:"
echo "  OPENAI_API_KEY=your_openai_api_key_here"
echo "  PYTHON_VERSION=3.11.0"

echo ""
echo "Frontend Service:"
echo "  NODE_VERSION=18"
echo "  NEXT_PUBLIC_WEBSOCKET_ENDPOINT=wss://your-backend-url/ws"

echo ""
echo "🌐 Deployment URLs will be:"
echo "  Backend:  https://voice-agent-backend-[hash].onrender.com"
echo "  Frontend: https://voice-agent-frontend-[hash].onrender.com"

echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo "🎯 Repository: https://github.com/mohammadalkhawaldah/Lozi-Core-Schools-Assistant-2"

echo ""
read -p "Press Enter to continue..."
