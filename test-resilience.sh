#!/bin/bash
set -euo pipefail
trap cleanup EXIT
DB_CONTAINER="ft_transcendence-db-1"
DB_VOLUME="ft_transcendence_postgres_data"
BACKEND_CONTAINER="ft_transcendence-backend-1"
DB_USER="postgres"
DB_NAME="transcendence"
TEST_TABLE="resilience_test"
MAX_WAIT=30

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
}

check_stack_running() {
  log_info "Comprobando que el stack está levantado..."

  if ! docker compose ps --status running | grep -q "$DB_CONTAINER"; then
    log_fail "El contenedor $DB_CONTAINER no está corriendo. Ejecuta 'make up' primero."
    exit 1
  fi

  if ! docker compose ps --status running | grep -q "$BACKEND_CONTAINER"; then
    log_fail "El contenedor $BACKEND_CONTAINER no está corriendo. Ejecuta 'make up' primero."
    exit 1
  fi

  log_pass "Stack levantado correctamente."
}
check_stack_running
setup_test_data() {
  log_info "Creando tabla de prueba e insertando dato conocido..."

  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
    "DROP TABLE IF EXISTS $TEST_TABLE;
     CREATE TABLE $TEST_TABLE (id SERIAL PRIMARY KEY, value TEXT);
     INSERT INTO $TEST_TABLE (value) VALUES ('resilience-check-12345');"

  log_pass "Dato de prueba insertado."
}
setup_test_data

simulate_db_crash() {
  log_info "Deteniendo el contenedor de la base de datos (simulando caída)..."

  docker stop "$DB_CONTAINER"

  log_pass "Contenedor detenido: $DB_CONTAINER"
}
simulate_db_crash

recover_and_wait() {
  log_info "Reiniciando el contenedor de la base de datos..."
  docker start "$DB_CONTAINER"

  log_info "Esperando a que la base de datos acepte conexiones (máx. ${MAX_WAIT}s)..."

  local waited=0
  until docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
    if [ "$waited" -ge "$MAX_WAIT" ]; then
      log_fail "La base de datos no respondió tras ${MAX_WAIT}s."
      exit 1
    fi
    sleep 1
    waited=$((waited + 1))
  done

  log_pass "Base de datos lista tras ${waited}s."
}

recover_and_wait

verify_data_integrity() {
  log_info "Verificando que el dato de prueba sigue presente..."

  local result
  result=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c \
    "SELECT value FROM $TEST_TABLE WHERE value = 'resilience-check-12345';")

  if [ "$result" = "resilience-check-12345" ]; then
    log_pass "Integridad de datos verificada: el registro sobrevivió a la caída."
  else
    log_fail "El dato de prueba NO se encontró. Posible pérdida de datos."
    exit 1
  fi
}
delete_volume() {
  log_info "Eliminando contenedor y volumen (${DB_VOLUME}) para simular pérdida de datos..."
  docker rm -f "$DB_CONTAINER" > /dev/null 2>&1 || true
  docker volume rm "$DB_VOLUME"
  log_pass "Contenedor y volumen eliminados."
}
verify_data_integrity

cleanup() {
  log_info "Limpiando datos de prueba..."

  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
    "DROP TABLE IF EXISTS $TEST_TABLE;"

  log_pass "Limpieza completada."
}

