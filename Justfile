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
clean:
    docker compose -f docker/docker-compose.dev.yml down -v
    rm -rf node_modules packages/*/node_modules apps/*/node_modules
    pnpm clean