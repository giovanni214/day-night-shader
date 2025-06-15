# Day/Night World Map Renderer (Node.js Version)

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

This project provides a high-performance HTTP API that renders a world map with a day/night terminator line based on a given sun position. This version is built with Node.js, Express, and uses native, headless OpenGL for GPU-accelerated rendering on a server.

> **Looking for the original Rust/SFML version?**
> This implementation is available on the [`rust` branch](https://github.com/giovanni214/day-night-shader/tree/rust).

---

## Local Installation & Usage

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### 1. Prerequisites

Before you begin, you will need the following installed on your system:

-   **Node.js:** Version 20.x or later is recommended.
-   **Git:** For cloning the repository.
-   **System Build Tools:** Required to compile the native `gl` dependency.
    -   On Debian/Ubuntu/WSL:
        ```bash
        sudo apt-get update
        sudo apt-get install -y build-essential pkg-config python-is-python3
        ```

### 2. Installation

First, clone the repository and switch to the `node` branch.

```bash
# Clone the entire repository
git clone https://github.com/giovanni214/day-night-shader.git

# Navigate into the new directory
cd day-night-shader

# IMPORTANT: Switch to the Node.js version
git checkout node
```

Next, install the required NPM packages.

```bash
npm install
```

### 3. Running the Server

Start the application from your terminal.

```bash
node server.js
```

By default, the server will start and listen on `http://localhost:3000`.

### 4. Using the API

Once the server is running, you can test the API endpoint. It accepts `lat` and `lon` as query parameters and returns a PNG image.

#### **Example with a Web Browser:**

Simply navigate to a URL with the desired coordinates.

-   **Sun over the Equator at the Prime Meridian:**
    `http://localhost:3000/?lat=0&lon=0`

-   **Sun over New York City (approx. 40.7° N, 74° W):**
    `http://localhost:3000/?lat=40.7&lon=-74`

#### **Example with `curl`:**

You can use a command-line tool like `curl` to fetch and save the image.

```bash
# Sun over Tokyo (approx. 35.7° N, 139.7° E)
curl "http://localhost:3000/?lat=35.7&lon=139.7" -o tokyo.png
```
This will save the rendered image as `tokyo.png` in your current directory.

---

## Docker Deployment

For a clean, portable deployment, you can use the included `Dockerfile`.

> **Note on Headless Rendering:**
> This version uses the `gl` package, which leverages native EGL for true headless rendering. Unlike the Rust/SFML version, it **does not** require a virtual display server like Xvfb.

### 1. Build the Docker Image

From the root of the project directory (on the `node` branch), run:

```bash
docker build -t day-night-shader-node .
```

### 2. Run the Container

This command runs the server and maps your local port 3000 to the container's port 3000.

```bash
docker run --rm -it -p 3000:3000 day-night-shader-node
```

---

## Configuration

You can customize the server's behavior by passing command-line arguments when running `node server.js` or when running the Docker container.

| Flag | Alias | Environment Variable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `--port` | `-p` | `PORT` | `3000` | The port for the server to listen on. |
| `--address` | `-a` | | `0.0.0.0` | The network address to bind to. |
| `--width` | `-w` | | `1400` | The width of the rendered PNG image in pixels. |
| `--debug` | `-d` | | `false` | Enables verbose diagnostic logging. |

### Docker Configuration Examples

-   **Run on a different port and set a custom render width:**
    ```bash
    docker run -p 8080:8080 -e PORT=8080 -it day-night-shader-node node server.js --width 2048
    ```

-   **Run with debug logging enabled:**
    ```bash
    docker run -p 3000:3000 -it day-night-shader-node node server.js --debug
    ```
