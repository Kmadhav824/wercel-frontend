FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_AUTH_URL=http://localhost:4000
ARG VITE_BACKEND_UPLOAD_URL=http://localhost:3000
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_REQUEST_HANDLER_DOMAIN=localhost:3001
ARG VITE_REQUEST_HANDLER_PROTOCOL=http

ENV VITE_AUTH_URL=$VITE_AUTH_URL \
    VITE_BACKEND_UPLOAD_URL=$VITE_BACKEND_UPLOAD_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_REQUEST_HANDLER_DOMAIN=$VITE_REQUEST_HANDLER_DOMAIN \
    VITE_REQUEST_HANDLER_PROTOCOL=$VITE_REQUEST_HANDLER_PROTOCOL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist/ ./
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  location / {' \
  '    try_files $uri $uri/ /index.html;' \
  '  }' \
  '  location /assets/ {' \
  '    expires 1y;' \
  '    add_header Cache-Control "public, immutable";' \
  '  }' \
  '}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q -O- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]