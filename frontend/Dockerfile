# Frontend Dockerfile for StarSpill
# Multi-stage build for optimized image

# Stage 1: Prepare files
FROM node:18-alpine AS builder

WORKDIR /app

# Copy all frontend files
COPY . .

# No build step needed for vanilla JS

# Stage 2: Production server with nginx
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend files from builder
COPY --from=builder /app /usr/share/nginx/html

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
