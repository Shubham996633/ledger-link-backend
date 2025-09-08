#!/bin/bash

# Ledger Link Backend Setup Script
echo "🚀 Setting up Ledger Link Backend..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy environment files
echo "⚙️ Setting up environment files..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "📝 Created .env file from template. Please update with your configuration."
fi

if [ ! -f contracts/.env ]; then
    cp contracts/env.example contracts/.env
    echo "📝 Created contracts/.env file from template. Please update with your configuration."
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p backend/logs

# Build backend
echo "🔨 Building backend..."
pnpm --filter backend build

# Compile contracts
echo "📜 Compiling smart contracts..."
pnpm --filter contracts compile

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env files with your configuration"
echo "2. Start the development environment: pnpm docker:up"
echo "3. Deploy contracts: pnpm contracts:deploy:goerli"
echo "4. Start development server: pnpm dev"
echo ""
echo "📚 Check README.md for detailed instructions"
