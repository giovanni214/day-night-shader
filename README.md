# Day/Night Shader (Rust Version)

![Rust](https://img.shields.io/badge/Rust-1.x-D74B00?style=for-the-badge&logo=rust)
![SFML](https://img.shields.io/badge/SFML-2.5-8CC445?style=for-the-badge&logo=sfml)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

This is the original Rust/SFML implementation of the day/night shader service. It provides a high-performance HTTP API that renders a world map with a day/night terminator based on a given sun position.

**Looking for the Node.js version?** Check out the [`node` branch](https://github.com/giovanni214/day-night-shader/tree/node).

---

## Local Installation & Usage

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

-   **Rust Toolchain:** Must be [installed](https://www.rust-lang.org/tools/install).
-   **SFML Development Libraries:** Required for compilation.
    -   On Debian/Ubuntu/WSL:
        ```bash
        sudo apt-get update
        sudo apt-get install libsfml-dev git
        ```
-   **Build Tools:**
    -   On Debian/Ubuntu/WSL:
        ```bash
        sudo apt-get install build-essential
        ```

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/giovanni214/day-night-shader.git
    cd day-night-shader
    ```

2.  **Build the release executable:**
    This command compiles the project with optimizations. The first build will take a while.
    ```bash
    cargo build --release --bin day-night-shader-native
    ```

### Running Locally

1.  **Run the binary directly:**
    The compiled application will be in the `target/release/` directory.
    ```bash
    ./target/release/day-night-shader-native
    ```

2.  **Run with custom options:**
    You can specify the address, port, and render width.
    ```bash
    ./target/release/day-night-shader-native -a 0.0.0.0:8080 -w 2048
    ```

---

## Docker Deployment

For a clean and portable deployment, you can use the included `Dockerfile`.

> **Note on SFML and Docker:**
> SFML is a graphical library that requires a display server to create a rendering context. The provided `Dockerfile` cleverly works around this on a headless server by installing and running **Xvfb** (X Virtual Framebuffer), a virtual display server that runs in memory.

### 1. Build the Docker Image

From the root of the project directory, run the following command. This will build the image using `cargo-chef` for optimized caching and tag it.

```bash
docker build -t day-night-shader-rust .
```

### 2. Run the Container

This command runs the server and maps your local port 3000 to the container's port 3000.

```bash
docker run --rm -it -p 3000:3000 day-night-shader-rust
```

-   `--rm`: Automatically removes the container when it stops.
-   `-it`: Runs in interactive mode so you can see logs and stop with `Ctrl+C`.
-   `-p 3000:3000`: Maps the host port to the container port.

The container will automatically start `Xvfb` and then launch the application, listening on `0.0.0.0:3000` by default.

### API Usage

Once the server is running (either locally or in Docker), you can access the API via a web browser or `curl`.

-   **Example URL:**
    `http://localhost:3000/?lat=40.7&lon=-74`

-   **Example `curl` command:**
    ```bash
    curl "http://localhost:3000/?lat=0&lon=0" -o render.png
    ```
