# YouTube Clone Project Makefile
# Common commands for development, database management, and deployment

.PHONY: help install dev build start lint clean setup db-setup db-reset db-seed db-studio test uploads-check uploads-clean

# Default target
help: ## Show this help message
	@echo "YouTube Clone Project - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Commands
install: ## Install all dependencies
	npm install

dev: ## Start development server with turbopack
	npm run dev

build: ## Build the application for production
	npm run build

start: ## Start production server
	npm run start

lint: ## Run ESLint
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint -- --fix

# Database Commands
db-generate: ## Generate Prisma client
	npm run db:generate

db-push: ## Push schema changes to database
	npm run db:push

db-reset: ## Reset database (WARNING: This will delete all data)
	npm run db:reset

db-seed: ## Seed database with initial data
	npm run db:seed

db-seed-videos: ## Seed database with sample videos
	npm run db:seed-videos

db-studio: ## Open Prisma Studio
	npm run db:studio

db-migrate: ## Create and apply database migration
	npx prisma migrate dev

db-deploy: ## Deploy migrations to production
	npx prisma migrate deploy

db-status: ## Check database migration status
	npx prisma migrate status

# Setup Commands
setup: ## Complete project setup (generate client + push schema)
	npm run setup

setup-dev: ## Setup and start development server
	npm run setup:dev

setup-full: ## Complete setup with database seeding
	$(MAKE) setup
	$(MAKE) db-seed

# File Management
uploads-check: ## Check uploads directory structure
	node check-uploads.js

uploads-clean: ## Clean temporary uploads
	rm -rf uploads/temp/*
	@echo "Temporary uploads cleaned"

uploads-clean-all: ## Clean all uploads (WARNING: This will delete all uploaded files)
	rm -rf uploads/*
	@echo "All uploads cleaned"

# Testing Commands
test: ## Run tests (if available)
	@echo "No tests configured yet"

test-watch: ## Run tests in watch mode
	@echo "No tests configured yet"

# Utility Commands
clean: ## Clean build artifacts and node_modules
	rm -rf .next
	rm -rf node_modules
	rm -rf dist
	@echo "Build artifacts cleaned"

clean-install: ## Clean and reinstall dependencies
	$(MAKE) clean
	$(MAKE) install

# Environment Commands
env-setup: ## Copy environment example file
	cp env.example .env
	@echo "Environment file created. Please update .env with your configuration."

env-check: ## Check if environment file exists
	@if [ -f .env ]; then echo "Environment file exists"; else echo "Environment file missing. Run 'make env-setup' first."; fi

# Docker Commands (if using Docker)
docker-build: ## Build Docker image
	docker build -t youtube-clone .

docker-run: ## Run Docker container
	docker run -p 3000:3000 youtube-clone

docker-dev: ## Run development environment with Docker Compose
	docker-compose up -d

docker-stop: ## Stop Docker containers
	docker-compose down

# Production Commands
prod-build: ## Build for production
	NODE_ENV=production npm run build

prod-start: ## Start production server
	NODE_ENV=production npm run start

# Backup Commands
backup-db: ## Create database backup (requires pg_dump)
	@echo "Creating database backup..."
	pg_dump $(DATABASE_URL) > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backup created"

# Monitoring Commands
logs: ## Show application logs
	tail -f logs/app.log 2>/dev/null || echo "No log file found"

status: ## Show application status
	@echo "Checking application status..."
	@ps aux | grep -E "(node|next)" | grep -v grep || echo "No Node.js processes running"

# Quick Commands
quick-start: ## Quick start for new developers
	$(MAKE) env-setup
	$(MAKE) install
	$(MAKE) setup-dev

restart: ## Restart development server
	pkill -f "next dev" || true
	$(MAKE) dev

# Development Utilities
create-thumbnail: ## Create test thumbnail
	node create-test-thumbnail.js

check-deps: ## Check for outdated dependencies
	npm outdated

update-deps: ## Update dependencies (interactive)
	npm update

# Git Commands
git-status: ## Show git status
	git status

git-log: ## Show recent git commits
	git log --oneline -10

git-pull: ## Pull latest changes
	git pull

git-push: ## Push changes
	git push

# Documentation
docs: ## Generate documentation
	@echo "No documentation generator configured"

# Security
audit: ## Run security audit
	npm audit

audit-fix: ## Fix security vulnerabilities
	npm audit fix

# Performance
analyze: ## Analyze bundle size
	npm run build
	npx @next/bundle-analyzer

# Database Utilities
db-backup-local: ## Backup local database
	pg_dump -h localhost -U postgres youtube_clone > backup_local_$(shell date +%Y%m%d_%H%M%S).sql

db-restore-local: ## Restore local database from backup
	@echo "Usage: make db-restore-local BACKUP_FILE=backup_file.sql"
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Please specify BACKUP_FILE"; exit 1; fi
	psql -h localhost -U postgres youtube_clone < $(BACKUP_FILE)

# All-in-one Commands
fresh-start: ## Complete fresh start (clean + install + setup + dev)
	$(MAKE) clean-install
	$(MAKE) env-setup
	$(MAKE) setup-dev

production-deploy: ## Deploy to production
	$(MAKE) prod-build
	$(MAKE) db-deploy
	$(MAKE) prod-start
