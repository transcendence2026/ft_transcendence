FROM grafana/grafana:latest

# Provisioning de datasources y dashboards (equivalente a "volumes:" con bind mounts)
COPY ./provisioning /etc/grafana/provisioning
COPY ./dashboards /var/lib/grafana/dashboards

# Puerto (documental; se publica con -p al hacer docker run)
EXPOSE 3000