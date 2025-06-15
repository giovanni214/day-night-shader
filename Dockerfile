# Dockerfile

# --- Stage 1: The Builder ---
# This stage installs all build tools and compiles native dependencies.
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install system dependencies needed for the 'gl' package build
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libegl1-mesa-dev \
    libgles2-mesa-dev \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first to leverage Docker's layer caching
COPY package*.json ./

# Install all Node.js dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .


# --- Stage 2: The Runtime ---
# This stage creates the final, smaller image for running the application.
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# Install ONLY the runtime system dependencies needed by the 'gl' package.
RUN apt-get update && apt-get install -y \
    libegl1-mesa \
    libgles2-mesa \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built node_modules and application code from the builder stage
COPY --from=builder /app .

# Set a default value for the PORT environment variable.
# This can be overridden at runtime with `docker run -e PORT=...`
ENV PORT 3000

# Expose the port defined by the environment variable.
EXPOSE $PORT

# Define the default command to run the application.
# The server.js script will automatically pick up the $PORT environment variable.
# Other arguments like --width or --debug can be appended to `docker run`.
CMD ["node", "server.js"]