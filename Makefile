# Makefile for Docker commands

.PHONY: help build up down restart logs clean dev prod

help: ## نمایش راهنما
	@echo "دستورات موجود:"
	@echo "  make build    - Build کردن images"
	@echo "  make up       - اجرای سرویس‌ها"
	@echo "  make down     - متوقف کردن سرویس‌ها"
	@echo "  make restart  - Restart سرویس‌ها"
	@echo "  make logs     - نمایش لاگ‌ها"
	@echo "  make clean    - پاک کردن همه چیز"
	@echo "  make dev      - اجرا در حالت Development"
	@echo "  make prod     - اجرا در حالت Production"

build: ## Build کردن images
	docker-compose build

up: ## اجرای سرویس‌ها
	docker-compose up -d

down: ## متوقف کردن سرویس‌ها
	docker-compose down

restart: ## Restart سرویس‌ها
	docker-compose restart

logs: ## نمایش لاگ‌ها
	docker-compose logs -f

clean: ## پاک کردن همه چیز
	docker-compose down -v
	docker system prune -f

dev: ## اجرا در حالت Development
	docker-compose -f docker-compose.dev.yml up

prod: ## اجرا در حالت Production
	docker-compose up -d --build

backend-logs: ## لاگ‌های Backend
	docker-compose logs -f backend

frontend-logs: ## لاگ‌های Frontend
	docker-compose logs -f frontend

backend-shell: ## دسترسی به Backend shell
	docker-compose exec backend sh

frontend-shell: ## دسترسی به Frontend shell
	docker-compose exec frontend sh

backup: ## Backup از database
	docker cp installment-backend:/app/installment_business.db ./backup_$(shell date +%Y%m%d_%H%M%S).db
	@echo "Backup saved!"

ps: ## نمایش وضعیت containerها
	docker-compose ps

stats: ## نمایش استفاده از منابع
	docker stats
