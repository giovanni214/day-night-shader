// renderer.js
const { workerData, parentPort } = require("worker_threads");
const fs = require("fs");
const path = require("path");
const getPixels = require("get-pixels");
const util = require("util");

console.log("[Worker] Worker thread started.");

const getPixelsAsync = util.promisify(getPixels);

console.log("[Worker] Reading shader files...");
const vertShaderSrc = fs.readFileSync(path.join(__dirname, "vertex.vert"), "utf8");
const fragShaderSrc = fs.readFileSync(path.join(__dirname, "shader.frag"), "utf8");
console.log("[Worker] Shader files read successfully.");

const { width, earthDayPath, earthNightPath } = workerData;
const height = width / 2;

console.log(`[Worker] Creating ${width}x${height} headless GL context...`);
const gl = require("gl")(width, height, {
	preserveDrawingBuffer: true
});
console.log("[Worker] GL context created.");

// --- THE FIX IS HERE ---
function compileShader(source, type) {
	// Log the raw source using JSON.stringify to make invisible characters visible
	console.log(`[Worker] Raw source for shader type ${type}:`, JSON.stringify(source));

	// Trim the source to remove any leading/trailing whitespace or invisible characters
	const trimmedSource = source.trim();

	if (source.length !== trimmedSource.length) {
		console.log("[Worker] NOTE: Shader source was trimmed. This likely fixed the issue.");
	}

	const shader = gl.createShader(type);
	// Use the trimmed source
	gl.shaderSource(shader, trimmedSource);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		// Log the source that failed to compile
		console.error("[Worker] FAILED TO COMPILE THE FOLLOWING SHADER SOURCE:");
		console.error("----------------------------------------------------");
		console.error(trimmedSource);
		console.error("----------------------------------------------------");
		throw new Error(`Shader compile error: ${gl.getShaderInfoLog(shader)}`);
	}
	return shader;
}

async function createTexture(filePath) {
	console.log(`[Worker] Loading texture from: ${filePath}`);
	const pixels = await getPixelsAsync(filePath);
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pixels.shape[0], pixels.shape[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels.data);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	console.log(`[Worker] Texture loaded successfully: ${filePath}`);
	return texture;
}

async function setup() {
	console.log("[Worker] Starting async setup...");
	console.log("[Worker] Compiling and linking shader program...");
	const vertShader = compileShader(vertShaderSrc, gl.VERTEX_SHADER);
	const fragShader = compileShader(fragShaderSrc, gl.FRAGMENT_SHADER);
	const program = gl.createProgram();
	gl.attachShader(program, vertShader);
	gl.attachShader(program, fragShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
	}
	gl.useProgram(program);
	console.log("[Worker] Shader program linked.");

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
	const positionLocation = gl.getAttribLocation(program, "position");
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

	const uSunDir = gl.getUniformLocation(program, "u_sun_dir");
	const uResolution = gl.getUniformLocation(program, "u_resolution");
	const uMapDay = gl.getUniformLocation(program, "u_map_day");
	const uMapNight = gl.getUniformLocation(program, "u_map_night");

	const dayTexture = await createTexture(earthDayPath);
	const nightTexture = await createTexture(earthNightPath);

	gl.uniform2f(uResolution, width, height);
	gl.uniform1i(uMapDay, 0);
	gl.uniform1i(uMapNight, 1);

	console.log("[Worker] Attaching message listener...");
	parentPort.on("message", ({ id, lat, lon }) => {
		const slat = (lat * Math.PI) / 180.0;
		const slon = (lon * Math.PI) / 180.0;
		const sunDir = [Math.cos(slat) * Math.cos(slon), Math.cos(slat) * Math.sin(slon), Math.sin(slat)];
		gl.uniform3fv(uSunDir, sunDir);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, dayTexture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, nightTexture);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		const pixels = new Uint8Array(width * height * 4);
		gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		parentPort.postMessage({ id, pixels }, [pixels.buffer]);
	});

	console.log("[Worker] Setup complete. Sending 'ready' signal to main thread.");
	parentPort.postMessage({ ready: true });
}

setup().catch((err) => {
	console.error("[Worker] CRITICAL ERROR during setup:", err);
	parentPort.postMessage({ error: err.message || "An unknown error occurred in the worker." });
});
