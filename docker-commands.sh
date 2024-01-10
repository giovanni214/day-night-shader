#!/bin/bash
Xvfb :99 &
export DISPLAY=:99
export RUST_LOG=info
day-night-shader-native -w 2048 -a "0.0.0.0:3000"