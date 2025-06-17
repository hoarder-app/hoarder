#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Check if Docker is installed
if ! command_exists docker; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if pnpm is installed
if ! command_exists pnpm; then
    echo "Error: pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Start Meilisearch if not already running
if ! port_in_use 7700; then
    echo "Starting Meilisearch..."
    docker run -d -p 7700:7700 --name karakeep-meilisearch getmeili/meilisearch:v1.13.3
else
    echo "Meilisearch is already running on port 7700"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Start the web app and workers in parallel
echo "Starting web app and workers..."
pnpm web & WEB_PID=$!
pnpm workers & WORKERS_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down services..."
    kill $WEB_PID $WORKERS_PID 2>/dev/null
    docker stop karakeep-meilisearch 2>/dev/null
    docker rm karakeep-meilisearch 2>/dev/null
    exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

echo "Development environment is running!"
echo "Web app: http://localhost:3000"
echo "Meilisearch: http://localhost:7700"
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
wait 
