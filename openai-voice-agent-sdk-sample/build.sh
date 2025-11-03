#!/bin/bash

echo "🚀 Building Voice Agent App for Render..."

# Step 1: Install Python backend dependencies
echo "📦 Installing Python backend dependencies..."
cd server
pip install -e .
cd ..

# Step 2: Check if Node.js is available
echo "🔍 Checking Node.js availability..."
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
    if command -v npm &> /dev/null; then
        echo "✅ npm found: $(npm --version)"
    else
        echo "❌ npm not found, trying to install..."
        # Try different package managers that might be available
        if command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y npm
        elif command -v yum &> /dev/null; then
            yum install -y npm
        else
            echo "❌ Cannot install npm"
            exit 1
        fi
    fi
else
    echo "❌ Node.js not found, trying to install..."
    # Try to install Node.js using nvm if available
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        echo "🔄 Using nvm to install Node.js..."
        . "$HOME/.nvm/nvm.sh"
        nvm install 18
        nvm use 18
    else
        # Try installing Node.js directly
        if command -v apt-get &> /dev/null; then
            echo "🔄 Installing Node.js via apt-get..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
        else
            echo "❌ Cannot install Node.js"
            echo "💡 Trying to continue without frontend build..."
            echo "⚠️  Frontend may not be available"
            exit 0
        fi
    fi
fi

# Step 3: Build frontend
echo "🎨 Building frontend..."
cd frontend
npm install
npm run export
cd ..

echo "✅ Build completed successfully!"
