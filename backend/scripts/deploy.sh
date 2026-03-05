#!/bin/bash

# Production deployment script for APIBR with profile selection

set -e

PROFILE="${APIBR_PROFILE:-vps}"
SERVICE="apibr-cpu"

case "$PROFILE" in
    full)
        SERVICE="apibr"
        ;;
    cpu-only|vps)
        SERVICE="apibr-cpu"
        ;;
    api-only)
        SERVICE="apibr-api"
        ;;
    *)
        echo "Invalid APIBR_PROFILE: $PROFILE"
        echo "Use one of: vps | full | cpu-only | api-only"
        exit 1
        ;;
esac

echo "Starting APIBR production deployment..."
echo "Profile: $PROFILE | Service: $SERVICE"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create production environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo "Creating production environment file..."
    cp .env.example .env.production
    echo "Please edit .env.production with your production settings before continuing."
    echo "Important: set API_KEYS for security."
    exit 1
fi

# Build and start services
echo "Building Docker images..."
docker-compose --profile "$PROFILE" build "$SERVICE"

echo "Starting Redis..."
docker-compose --profile "$PROFILE" up -d redis

echo "Waiting for Redis to be ready..."
sleep 5

echo "Starting APIBR API..."
docker-compose --profile "$PROFILE" up -d "$SERVICE"

echo "Checking service health..."
sleep 10

# Health check
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "APIBR is running successfully."
    echo "API Documentation: http://localhost:3000/api/docs"
    echo "Metrics: http://localhost:3000/api/metrics"
    echo "Health Check: http://localhost:3000/health"
else
    echo "Health check failed. Checking logs..."
    docker-compose --profile "$PROFILE" logs "$SERVICE"
    exit 1
fi

echo "Deployment completed successfully."
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose --profile $PROFILE logs -f $SERVICE"
echo "  Stop services: docker-compose --profile $PROFILE down"
echo "  Restart: docker-compose --profile $PROFILE restart $SERVICE"
echo "  Update: git pull && docker-compose --profile $PROFILE build $SERVICE && docker-compose --profile $PROFILE up -d $SERVICE"
