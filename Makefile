.PHONY: help build up down restart logs ps clean

COMPOSE := docker compose

help:
	@printf "Available commands:\n"
	@printf "  make build    Build all service images\n"
	@printf "  make up       Build and start the application\n"
	@printf "  make down     Stop and remove containers\n"
	@printf "  make restart  Restart all services\n"
	@printf "  make logs     Follow service logs\n"
	@printf "  make ps       Show service status\n"
	@printf "  make clean    Stop services and remove database volume\n"

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v --remove-orphans
