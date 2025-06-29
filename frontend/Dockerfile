# frontend/Dockerfile
# Production Dockerfile for frontend
FROM node:18-alpine AS build

WORKDIR /app

# Install Angular CLI
RUN npm install -g @angular/cli@18

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN ng build --configuration production

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from build stage
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]