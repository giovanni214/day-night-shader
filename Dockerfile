# --- Stage 1: The Builder ---
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install build dependencies for compiling the 'gl' package
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libegl1-mesa-dev \
    libgles2-mesa-dev \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Copy source code (respecting .dockerignore)
COPY . .

# --- Stage 2: The Runtime ---
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# Install runtime dependencies:
# - libxext6, libxi6: Required for GL context linking
# - xvfb, xauth: Required to create a virtual display
# - libgl1, libgl1-mesa-dri: Software rasterizer for OpenGL
RUN apt-get update && apt-get install -y \
    libegl1-mesa \
    libgles2-mesa \
    libxext6 \
    libxi6 \
    libxrender1 \
    xvfb \
    xauth \
    libgl1 \
    libgl1-mesa-dri \
    && rm -rf /var/lib/apt/lists/*

# Copy built node_modules and app from builder
COPY --from=builder /app .

ENV PORT=3000
EXPOSE $PORT

# Start command:
# 1. wraps execution in 'sh -c' to ensure proper signal handling
# 2. Uses 'xvfb-run' to create a fake monitor
# 3. Sets server-args to ensure 24-bit color depth (prevents visual errors)
CMD ["sh", "-c", "xvfb-run -a --server-args='-screen 0 1024x768x24' node server.js"]