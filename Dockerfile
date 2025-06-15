# Dockerfile
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install build dependencies for gl and other native modules
RUN apt-get update && apt-get install -y build-essential pkg-config libegl1-mesa-dev libgles2-mesa-dev && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the server will run on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "server.js", "--address", "0.0.0.0", "--port", "3000", "--width", "2048"]