# Data Persistence

## Purpose

This document explains how PostgreSQL data persistence works in this project and what is verified by `test-resilience.sh`.

The recommended filename is `DataPersistence.md`. `Persistence` is the correct English spelling for this topic.

## Docker Storage Configuration

PostgreSQL runs in the `db` service defined in `docker-compose.yml`.

The database data directory is mounted as follows:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

This configuration has two important parts:

- `postgres_data` is a named Docker volume.
- `/var/lib/postgresql/data` is PostgreSQL's data directory inside the container.

PostgreSQL stores its database files in that directory. Because the directory belongs to a named volume, the files are stored outside the container's writable layer.

Removing and recreating the database container does not remove the named volume. The new container mounts the existing volume again and can read the same PostgreSQL data.

## Named Volumes in This Project

The Compose file declares these named volumes:

```yaml
volumes:
  postgres_data:
  backend_node_modules:
  frontend_node_modules:
  uploads_data:
```

Their purposes are different:

| Volume | Purpose |
| --- | --- |
| `postgres_data` | PostgreSQL database files and persistent database state. |
| `backend_node_modules` | Backend dependencies for the development container. |
| `frontend_node_modules` | Frontend dependencies for the development container. |
| `uploads_data` | Uploaded files shared by the backend and Nginx. |

The resilience test checks only `postgres_data`.

## Network Isolation

PostgreSQL is connected only to `backend-net`:

```yaml
networks:
  - backend-net
```

The network is configured as an internal bridge network:

```yaml
backend-net:
  driver: bridge
  internal: true
```

The database service does not publish port `5432` to the host. The port mapping is commented out in `docker-compose.yml`.

The backend connects to PostgreSQL through the Docker service name:

```text
postgresql://postgres:postgrespassword@db:5432/transcendence?schema=public
```

Therefore:

- The backend can reach PostgreSQL through the private Docker network.
- PostgreSQL is not directly exposed on the host's port `5432`.
- External clients cannot connect directly to the database through the host by default.

## Test Requirements

Before running the test, the development stack must be running:

```bash
make up
```

The test requires both services below:

- The `db` container must exist and be running.
- The `backend` container must exist and be running.

The backend check ensures that the complete application stack is available while the database test runs.

## What `test-resilience.sh` Checks

### 1. Container discovery

The script obtains the current container IDs with:

```bash
docker compose ps -q db
docker compose ps -q backend
```

It does not rely on a hard-coded container name. This is important because Compose container names can change when the project name or deployment context changes.

### 2. Container state

The script uses `docker inspect` to verify that both containers are running.

The test stops with an error if either service is missing or stopped.

### 3. Volume discovery

The script inspects the database container mounts and searches for the PostgreSQL data directory:

```text
/var/lib/postgresql/data
```

It stores the actual mounted volume name in `DB_VOLUME` and confirms that Docker can inspect that volume.

This avoids assuming that the volume is always called `ft_transcendence_postgres_data`.

### 4. Test data creation

The script creates a temporary table named `resilience_test`.

It then inserts one unique value generated from the current timestamp and the shell process ID:

```text
resilience-check-<timestamp>-<process-id>
```

The SQL command uses `ON_ERROR_STOP=1`, so `psql` returns an error when a SQL statement fails.

The script then counts matching rows and requires exactly one row before continuing.

### 5. Controlled database stop

The script stops PostgreSQL with:

```bash
docker stop "$DB_CONTAINER"
```

It then checks the container state and confirms that the container is no longer running.

This simulates a controlled container shutdown. It verifies that PostgreSQL data remains available after the container is stopped and started again.

### 6. Database recovery

The script starts the same container again:

```bash
docker start "$DB_CONTAINER"
```

It repeatedly runs `pg_isready` until PostgreSQL accepts connections or the 30-second timeout is reached.

The script does not query the database immediately after starting it. It waits for PostgreSQL readiness first.

### 7. Persistence after `stop/start`

After PostgreSQL becomes ready, the script queries the temporary table and compares the stored value with the original value.

A successful result proves that the database row survived this sequence:

```text
insert row -> docker stop -> docker start -> query row
```

### 8. Container recreation

The script then performs these operations:

```bash
docker compose stop db
docker compose rm -f db
docker compose up -d db
```

This removes the database container but does not remove `postgres_data`.

The script obtains the new database container ID and waits for PostgreSQL to become ready again.

### 9. Volume identity verification

After recreation, the script inspects the new container and resolves its mounted volume name.

It compares the new name with the original `DB_VOLUME` value.

The test passes only when both values are identical. This confirms that the replacement container is using the same named volume.

### 10. Persistence after container recreation

The script queries the test table again after the new container is ready.

A successful result proves that the row survived this sequence:

```text
insert row -> stop container -> remove container -> create new container -> query row
```

This is the strongest persistence check currently implemented in the script.

### 11. Cleanup

The script registers a Bash `EXIT` trap:

```bash
trap cleanup EXIT
```

When the script exits, it attempts to drop the temporary `resilience_test` table if the current database container exists and is running.

The cleanup does not remove the named volume. The PostgreSQL data volume remains available for the application.

## Successful Test Output

A successful run should include results equivalent to:

```text
[PASS] Volumen persistente detectado
[PASS] Stack levantado correctamente.
[PASS] Dato de prueba insertado.
[PASS] Caída controlada simulada.
[PASS] Base de datos lista
[PASS] El registro sobrevivió a docker stop/start.
[PASS] Contenedor recreado usando el mismo volumen persistente.
[PASS] El registro sobrevivió a la recreación del contenedor.
[PASS] Limpieza completada.
```

## How to Run the Test

Start the stack:

```bash
make up
```

Run the persistence test:

```bash
./test-resilience.sh
```

If the file is not executable, grant execute permission once:

```bash
chmod +x test-resilience.sh
```

The test should be run from the project root, where `docker-compose.yml` and `test-resilience.sh` are located.

## What the Test Does Not Check

The current test intentionally does not perform the following actions:

- It does not delete `postgres_data`.
- It does not verify recovery after `docker kill`.
- It does not simulate host disk failure.
- It does not test PostgreSQL replication or backups.
- It does not validate data from the application API.
- It does not verify upload persistence in `uploads_data`.

Deleting the named volume would intentionally destroy the database state and should be tested separately only in an isolated environment.

## Important Data Safety Notes

The normal cleanup removes only the temporary test table. It does not run `docker compose down -v` and does not remove `postgres_data`.

The following command removes named volumes and must not be used when database data must be preserved:

```bash
make clean
```

In the current Makefile, `make clean` runs:

```bash
docker compose down -v --remove-orphans
```

The `-v` option removes Compose-managed volumes, including the PostgreSQL volume.

## Summary

The project uses a named Docker volume to keep PostgreSQL data independent from the database container lifecycle. The backend reaches PostgreSQL through an internal Docker network, while port `5432` is not published externally.

`test-resilience.sh` verifies that a known database row survives both a controlled `stop/start` cycle and complete database container recreation. It also verifies that the recreated container uses the same named volume. This demonstrates container-level persistence, but it is not a replacement for backups or disaster recovery testing.
