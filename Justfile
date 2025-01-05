set dotenv-load

# List all available commands
default:
    @just --list

# Start development environment
dev:
    @echo "Starting development environment..."
    docker compose -f docker/docker-compose.dev.yml up --build

# Stop all containers
stop:
    docker compose -f docker/docker-compose.yml down
    docker compose -f docker/docker-compose.dev.yml down

# Clean everything (containers, volumes, node_modules)
clean-all:
    docker compose -f docker/docker-compose.dev.yml down -v
    docker system prune -a --force
    rm -rf node_modules packages/*/node_modules apps/*/node_modules
    pnpm clean
    pnpm install

# Push latest images to registry for docker-compose
push-latest:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Login to AWS ECR
    aws ecr get-login-password --region us-east-1 --profile pique | docker login --username AWS --password-stdin 654654146385.dkr.ecr.us-east-1.amazonaws.com
    
    # Build and push consolidated image
    echo "Building and pushing consolidated image..."
    docker build \
        --file docker/Dockerfile \
        --target aio \
        --tag 654654146385.dkr.ecr.us-east-1.amazonaws.com/pique/hoarder:hoarder-latest \
        .
    docker push 654654146385.dkr.ecr.us-east-1.amazonaws.com/pique/hoarder:hoarder-latest

# Run the ECR images
run-ecr:
    aws ecr get-login-password --region us-east-1 --profile pique | docker login --username AWS --password-stdin 654654146385.dkr.ecr.us-east-1.amazonaws.com
    docker compose -f docker/docker-compose.yml up
