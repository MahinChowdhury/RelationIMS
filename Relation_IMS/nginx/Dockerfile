FROM nginx:alpine

# Install openssl to generate self-signed fallback certificates
RUN apk update && apk add --no-cache openssl
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx-selfsigned.key \
    -out /etc/nginx/ssl/nginx-selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
