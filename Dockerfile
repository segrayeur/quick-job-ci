# Stage 1: Build the application
FROM oven/bun:1 as builder
WORKDIR /app

# Copy package management files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN bun run build

# Stage 2: Serve the application
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default Nginx welcome page
RUN rm -rf ./*

# Copy built assets from the builder stage
COPY --from=builder /app/dist .

# Expose port 80
EXPOSE 80

# Start Nginx and serve the application
CMD ["nginx", "-g", "daemon off;"]