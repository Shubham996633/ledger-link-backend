#!/bin/bash

# Ledger Link Backend AWS Deployment Script
set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-}
ECR_REPOSITORY="ledger-link-backend"
ECS_CLUSTER="ledger-link-cluster"
ECS_SERVICE="ledger-link-backend-service"
TASK_DEFINITION="ledger-link-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        log_error "AWS_ACCOUNT_ID environment variable is not set"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Build and push Docker image
build_and_push_image() {
    log_info "Building and pushing Docker image..."
    
    # Build the image
    docker build -t $ECR_REPOSITORY:latest ./backend
    
    # Tag for ECR
    docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    
    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Push image
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    
    log_info "Docker image pushed successfully"
}

# Update ECS service
update_ecs_service() {
    log_info "Updating ECS service..."
    
    # Update task definition with new image
    TASK_DEF_ARN=$(aws ecs describe-task-definition --task-definition $TASK_DEFINITION --query 'taskDefinition.taskDefinitionArn' --output text)
    
    # Create new task definition revision
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --task-definition $TASK_DEFINITION \
        --force-new-deployment
    
    log_info "ECS service update initiated"
}

# Wait for deployment to complete
wait_for_deployment() {
    log_info "Waiting for deployment to complete..."
    
    aws ecs wait services-stable \
        --cluster $ECS_CLUSTER \
        --services $ECS_SERVICE
    
    log_info "Deployment completed successfully"
}

# Main deployment function
deploy() {
    log_info "Starting deployment to AWS ECS..."
    
    check_prerequisites
    build_and_push_image
    update_ecs_service
    wait_for_deployment
    
    log_info "Deployment completed successfully!"
    log_info "Service URL: https://api.ledgerlink.com"
}

# Force deployment (skip some checks)
force_deploy() {
    log_info "Starting force deployment..."
    
    build_and_push_image
    update_ecs_service
    wait_for_deployment
    
    log_info "Force deployment completed!"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "force")
        force_deploy
        ;;
    "build")
        check_prerequisites
        build_and_push_image
        ;;
    "update")
        update_ecs_service
        wait_for_deployment
        ;;
    *)
        echo "Usage: $0 {deploy|force|build|update}"
        echo "  deploy: Full deployment with all checks"
        echo "  force:  Force deployment (skip some checks)"
        echo "  build:  Build and push Docker image only"
        echo "  update: Update ECS service only"
        exit 1
        ;;
esac
