#!/bin/bash
set -euo pipefail

# Store the database container ID.
DB_CONTAINER=""
# Store the database volume name.
DB_VOLUME=""
# Store the backend container ID.
BACKEND_CONTAINER=""
# Store the database username.
DB_USER="postgres"
# Store the database name.
DB_NAME="transcendence"
# Store the temporary table name.
TEST_TABLE="resilience_test"
# Generate a unique test value.
TEST_VALUE="resilience-check-$(date +%s)-$$"
# Set the readiness timeout.
MAX_WAIT=30

# Define the error color.
RED='\033[0;31m'
# Define the success color.
GREEN='\033[0;32m'
# Define the information color.
YELLOW='\033[1;33m'
# Define the color reset code.
NC='\033[0m'

# Print an info message.
log_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

# Print a pass message.
log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
}

# Print a failure message.
log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
}

# Inspect the database container mounts.
get_db_volume() {
  # Select the PostgreSQL data mount.
  # Print the mounted volume name.
  docker inspect -f \
    '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}' \
    "$DB_CONTAINER"
}

# Check the stack state.
check_stack_running() {
  log_info "Comprobando que el stack está levantado..."

  # Query the database container ID.
  DB_CONTAINER=$(docker compose ps -q db)
  # Query the backend container ID.
  BACKEND_CONTAINER=$(docker compose ps -q backend)

  # Check that the database ID is not empty.
  if [ -z "$DB_CONTAINER" ]; then
    log_fail "No se encontró el contenedor de PostgreSQL. Ejecuta 'make up' primero."
    exit 1
  fi

  # Check that the backend ID is not empty.
  if [ -z "$BACKEND_CONTAINER" ]; then
    log_fail "No se encontró el contenedor del backend. Ejecuta 'make up' primero."
    exit 1
  fi

  # Read the database running state.
  if [ "$(docker inspect -f '{{.State.Running}}' "$DB_CONTAINER")" != "true" ]; then
    log_fail "El contenedor de PostgreSQL no está corriendo. Ejecuta 'make up' primero."
    exit 1
  fi

  # Read the backend running state.
  if [ "$(docker inspect -f '{{.State.Running}}' "$BACKEND_CONTAINER")" != "true" ]; then
    log_fail "El contenedor del backend no está corriendo. Ejecuta 'make up' primero."
    exit 1
  fi

  # Resolve the mounted volume name.
  DB_VOLUME=$(get_db_volume)
  # Check that a volume name was found.
  if [ -z "$DB_VOLUME" ]; then
    log_fail "PostgreSQL no tiene un volumen persistente montado."
    exit 1
  fi

  # Inspect the volume in Docker.
  docker volume inspect "$DB_VOLUME" >/dev/null
  # Report the detected volume.
  log_pass "Volumen persistente detectado: $DB_VOLUME"
  # Report the valid stack.
  log_pass "Stack levantado correctamente."
}

# Prepare test data.
setup_test_data() {
  log_info "Creando tabla de prueba e insertando dato conocido..."

  # Execute the setup SQL.
  # Stop psql when a SQL command fails.
  # Drop old test data in the SQL string.
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 -c \
    "DROP TABLE IF EXISTS $TEST_TABLE;
     -- Create a temporary test table.
     CREATE TABLE $TEST_TABLE (id SERIAL PRIMARY KEY, value TEXT NOT NULL);
     -- Insert the unique test row.
     INSERT INTO $TEST_TABLE (value) VALUES ('$TEST_VALUE');"

  # Declare the row count variable.
  local count
  # Count rows containing the test value.
  # Return an unformatted scalar value.
  count=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    -tA -v ON_ERROR_STOP=1 -c \
    "SELECT COUNT(*) FROM $TEST_TABLE WHERE value = '$TEST_VALUE';")

  # Check that exactly one row exists.
  if [ "$count" != "1" ]; then
    log_fail "El dato de prueba no se insertó correctamente."
    exit 1
  fi

  log_pass "Dato de prueba insertado."
}

# Stop PostgreSQL.
simulate_db_crash() {
  log_info "Deteniendo PostgreSQL con docker stop..."
  # Stop the database container gracefully.
  docker stop "$DB_CONTAINER" >/dev/null

  # Read the container state after stopping it.
  if [ "$(docker inspect -f '{{.State.Running}}' "$DB_CONTAINER")" = "true" ]; then
    log_fail "PostgreSQL sigue corriendo después de docker stop."
    exit 1
  fi

  log_pass "Caída controlada simulada."
}

# Wait for PostgreSQL.
wait_for_database() {
  log_info "Esperando a que PostgreSQL acepte conexiones (máx. ${MAX_WAIT}s)..."

  # Initialize the elapsed-time counter.
  local waited=0
  # Check PostgreSQL repeatedly.
  until docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
    # Compare elapsed time with the limit.
    if [ "$waited" -ge "$MAX_WAIT" ]; then
      log_fail "PostgreSQL no respondió tras ${MAX_WAIT}s."
      exit 1
    fi
    # Pause before the next check.
    sleep 1
    # Add one second to the counter.
    waited=$((waited + 1))
  done

  log_pass "Base de datos lista tras ${waited}s."
}

# Recover the database.
recover_db() {
  # Start the stopped database container.
  log_info "Iniciando el contenedor de PostgreSQL..."
  docker start "$DB_CONTAINER" >/dev/null
  # Wait for PostgreSQL readiness.
  wait_for_database
}

# Verify test data.
verify_data_integrity() {
  # Receive the current test stage.
  local stage="$1"
  log_info "Verificando los datos después de ${stage}..."

  # Declare the query result variable.
  local result
  # Read the stored test value.
  # Return the value without formatting.
  result=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    -tA -v ON_ERROR_STOP=1 -c \
    "SELECT value FROM $TEST_TABLE WHERE value = '$TEST_VALUE';")

  # Compare the stored value with the original value.
  if [ "$result" = "$TEST_VALUE" ]; then
    log_pass "El registro sobrevivió a ${stage}."
  else
    log_fail "El dato de prueba no sobrevivió a ${stage}."
    exit 1
  fi
}

# Recreate the database container.
recreate_db_container() {
  log_info "Eliminando y recreando el contenedor de PostgreSQL..."

  # Stop the Compose database service.
  docker compose stop db >/dev/null
  # Remove the stopped database container.
  docker compose rm -f db >/dev/null
  # Create a replacement container.
  docker compose up -d db >/dev/null
  # Query the replacement container ID.
  DB_CONTAINER=$(docker compose ps -q db)

  # Check that the replacement ID is not empty.
  if [ -z "$DB_CONTAINER" ]; then
    log_fail "No se pudo recrear el contenedor de PostgreSQL."
    exit 1
  fi

  wait_for_database

  # Declare the replacement volume variable.
  local new_volume
  # Resolve the replacement volume name.
  new_volume=$(get_db_volume)
  # Compare both volume names.
  if [ "$new_volume" != "$DB_VOLUME" ]; then
    log_fail "El contenedor recreado usa otro volumen: $new_volume"
    exit 1
  fi

  log_pass "Contenedor recreado usando el mismo volumen persistente."
}

# Remove test data on exit.
cleanup() {
  log_info "Limpiando datos de prueba..."

  # Check that the container ID exists.
  if [ -n "$DB_CONTAINER" ] && docker inspect "$DB_CONTAINER" >/dev/null 2>&1 && \
     [ "$(docker inspect -f '{{.State.Running}}' "$DB_CONTAINER")" = "true" ]; then
    # Drop the temporary test table.
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
      -v ON_ERROR_STOP=1 -c "DROP TABLE IF EXISTS $TEST_TABLE;" >/dev/null || true
    # Report successful cleanup.
    log_pass "Limpieza completada."
  else
    # Report skipped cleanup.
    log_info "Limpieza omitida: PostgreSQL no está disponible."
  fi
}

# Register cleanup for normal exit.
trap cleanup EXIT

# Check the initial stack.
check_stack_running
# Insert the test row.
setup_test_data
# Stop the database.
simulate_db_crash
# Restart the database.
recover_db
# Verify stop/start persistence.
verify_data_integrity "docker stop/start"
# Recreate the database container.
recreate_db_container
# Verify recreation persistence.
verify_data_integrity "la recreación del contenedor"
