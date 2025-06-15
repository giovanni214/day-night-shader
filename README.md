# day-night-shader

# Day/Night Shader (Rust Version)

This is the Rust/SFML implementation of the day/night shader service.

**Looking for the Node.js version?** Check out the [node branch](https://github.com/giovanni214/day-night-shader/tree/node-day-night-shader).

---

## Installation (Rust)
... (your existing Rust installation instructions) ...

### To Build and Install Locally
Rust must be [installled.](https://www.rust-lang.org/tools/install)
The SMFL dev library should also be installed. On Debian:
```bash
sudo apt-get install libsfml-dev git
```

\
To download and build the executable:
```bash
git clone https://github.com/giovanni214/day-night-shader.git
cd day-night-shader
cargo build --release --bin day-night-shader-native #this will take a while
```

\
Your executable will be located in `/target/release/day-night-shader-native`
If you wish to install it locally:
```bash
cp /target/release/day-night-shader-native /usr/local/bin
```
