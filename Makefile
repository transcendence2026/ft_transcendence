.PHONY: help build certs up down restart logs ps clean

COMPOSE := docker compose

CERT_DIR := proxy/certs
CERT_KEY := $(CERT_DIR)/selfsigned.key
CERT_CRT := $(CERT_DIR)/selfsigned.crt

help:
	@printf "Available commands:\n"
	@printf "  make build    Build all service images\n"
		@printf "  make up       Build and start the development stack\n"
	@printf "  make down     Stop and remove containers\n"
	@printf "  make restart  Restart all services\n"
	@printf "  make logs     Follow service logs\n"
	@printf "  make ps       Show service status\n"
	@printf "  make clean    Stop services and remove database volume\n"

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

up: certs
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
	@if [ -d proxy/certs ]; then \
		rm -rf proxy/certs; \
		printf "Self-signed certificate deleted\n"; \
	fi
	$(COMPOSE) down -v --remove-orphans
