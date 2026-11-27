FROM grafana/grafana:latest

# Datasources and dashboards provisioning (equivalent to "volumes:" with bind mounts)
COPY ./provisioning /etc/grafana/provisioning
COPY ./dashboards /var/lib/grafana/dashboards

# Port (informational; published with -p when running docker run)
EXPOSE 3000