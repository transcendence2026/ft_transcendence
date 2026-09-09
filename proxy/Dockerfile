FROM nginx:1.27-alpine

# Remove Nginx's default configuration to avoid conflicts.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Mount certificates as a read-only volume instead of copying them into the image.
# This avoids rebuilding the image when certificates change.
# See docker-compose.yml: ./proxy/certs:/etc/nginx/certs:ro
EXPOSE 80 443

# Validate the configuration and keep Nginx running in the foreground.
CMD ["nginx", "-g", "daemon off;"]