# Stage 1: Build the React Application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (for better Docker caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the production React files
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration for routing and port 7860
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 7860 as required by Hugging Face Spaces
EXPOSE 7860

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
