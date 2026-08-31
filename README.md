# ft_transcendence

## Docker services

This project runs three containers through Docker Compose:

- `frontend`: React built with Vite and served by Nginx
- `backend`: Node.js API using Express
- `db`: PostgreSQL with the schema in `db/init.sql`

### Start

```sh
make up
```

Open the frontend at http://localhost:8080. The API is available at http://localhost:3000 and PostgreSQL at port `5432`.

### Useful commands

```sh
make logs     # Follow all service logs
make ps       # Show service status
make down     # Stop the containers
make clean    # Stop containers and delete the database volume
```