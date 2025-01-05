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
    aws ecr get-login-password --region us-west-2 --profile pique | docker login --username AWS --password-stdin 654654146385.dkr.ecr.us-west-2.amazonaws.com
    
    # Build and push web component
    echo "Building and pushing web component..."
    docker build \
        --file docker/Dockerfile \
        --target web \
        --tag 654654146385.dkr.ecr.us-west-2.amazonaws.com/pique/hoarder:hoarder-web-latest \
        .
    docker push 654654146385.dkr.ecr.us-west-2.amazonaws.com/pique/hoarder:hoarder-web-latest
    
    # Build and push workers component
    echo "Building and pushing workers component..."
    docker build \
        --file docker/Dockerfile \
        --target workers \
        --tag 654654146385.dkr.ecr.us-west-2.amazonaws.com/pique/hoarder:hoarder-workers-latest \
        .
    docker push 654654146385.dkr.ecr.us-west-2.amazonaws.com/pique/hoarder:hoarder-workers-latest
    
    # Build and push all-in-one image
    echo "Building and pushing all-in-one image..."
    docker build \
        --file docker/Dockerfile \
        --target aio \
        --tag 654654146385.dkr.ecr.us-west-2.amazonaws.com/pique/hoarder:hoarder-latest \
        .
    docker push 654654146385.dkr.ecr.us-west-2.amazonaws.com/pique/hoarder:hoarder-latest
