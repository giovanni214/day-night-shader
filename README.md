# Day/Night Shader (Node.js Version)

This is the Node.js/Express/Headless-GL implementation of the day/night shader service.

**Looking for the original Rust/SFML version?** Check out the [`main` branch](https://github.com/YOUR_USERNAME/YOUR_REPO/tree/main).

---

## Installation (Node.js)

1.  **Prerequisites:**
    *   Node.js (v20 or later recommended)
    *   Build tools (`build-essential`, `pkg-config` on Linux)
    *   System libraries for OpenGL: `sudo apt-get install libegl1-mesa-dev libgles2-mesa-dev python-is-python3`

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Server:**
    ```bash
    node server.js
    ```

## Docker

You can also run the application using Docker:

1.  **Build the image:**
    ```bash
    docker build -t day-night-shader .
    ```

2.  **Run the container:**
    ```bash
    docker run -p 3000:3000 -it day-night-shader
    ```

---
... (add API usage examples) ...
