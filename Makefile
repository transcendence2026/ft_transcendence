.PHONY: help build certs up push seed down restart logs ps clean monitor, monitor-down, monitor-logs

COMPOSE_FILE ?= docker-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)
MONITORING := docker compose -f monitoring/docker-compose.yml
NET := ft_transcendence_shared

CERT_DIR := proxy/certs
CERT_KEY := $(CERT_DIR)/selfsigned.key
CERT_CRT := $(CERT_DIR)/selfsigned.crt

# Socket de Docker detectado automáticamente (rootless o root)
export DOCKER_SOCK := $(shell docker context inspect --format '{{.Endpoints.docker.Host}}' 2>/dev/null | sed 's|unix://||')

help:
	@printf "Available commands:\n"
	@printf "  make build    Build all service images\n"
	@printf "  make up       Build and start the development stack\n"
	@printf "  make push     Push the Prisma schema to the database\n"
	@printf "  make seed     Seed the database\n"
	@printf "  make up COMPOSE_FILE=docker-compose-prod.yml  Start the production stack\n"
	@printf "  make down     Stop and remove containers\n"
	@printf "  make restart  Restart all services\n"
	@printf "  make logs     Follow service logs\n"
	@printf "  make ps       Show service status\n"
	@printf "  make clean    Stop services and remove database volume\n"
	@printf "  make monitor  Build and start the monitoring stack\n"

build:
	$(COMPOSE) build

certs:
	@if [ ! -f $(CERT_KEY) ] || [ ! -f $(CERT_CRT) ]; then \
		echo "Generating self-signed certificate..."; \
		mkdir -p $(CERT_DIR); \
		openssl req -x509 -nodes -days 365 \
			-newkey rsa:2048 \
			-keyout $(CERT_KEY) \
			-out $(CERT_CRT) \
			-subj "/CN=localhost"; \
	else \
		echo "Certificate already exists; skipping."; \
	fi

up: app wait-network monitor

app: certs
	$(COMPOSE) up --build -d

wait-network:
	@echo "Esperando a la red $(NET)..."
	@for i in $$(seq 1 30); do \
		docker network inspect $(NET) >/dev/null 2>&1 && exit 0; \
		sleep 1; \
	done; \
	echo "La red $(NET) no existe tras 30s"; exit 1

monitor:
	$(MONITORING) up --build -d

push:
	$(COMPOSE) exec backend npm run db:push

seed:
	$(COMPOSE) exec backend npx prisma db seed

down:
	$(MONITORING) down
	$(COMPOSE) down

monitor-down:
	$(MONITORING) down

restart:
	$(COMPOSE) restart
	$(MONITORING) restart

logs:
	$(COMPOSE) logs -f

monitor-logs:
	$(MONITORING) logs -f

ps:
	$(COMPOSE) ps

clean:
	@if [ -d proxy/certs ]; then \
		rm -rf proxy/certs; \
		printf "Self-signed certificate deleted\n"; \
	fi
	
	$(MONITORING) down -v --remove-orphans
	$(COMPOSE) down -v --remove-orphans
