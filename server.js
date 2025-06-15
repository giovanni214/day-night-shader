// server.js
const express = require("express");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { Worker } = require("worker_threads");
const path = require("path");
const sharp = require("sharp");

// --- Argument Parsing with Environment Variable Support ---
const argv = yargs(hideBin(process.argv))
	.option("p", {
		alias: "port",
		describe: "Port to listen on",
		// THE KEY CHANGE: Prioritize process.env.PORT, then fallback to 3000.
		// A command-line --port flag will still override this.
		default: process.env.PORT || 3000,
		type: "number"
	})
	.option("a", {
		alias: "address",
		describe: "Address to bind to",
		default: "0.0.0.0", // Default to 0.0.0.0 for container accessibility
		type: "string"
	})
	.option("w", {
		alias: "width",
		describe: "Width of the rendered image",
		default: 2048,
		type: "number"
	})
	.option("d", {
		alias: "debug",
		describe: "Enable verbose debug logging",
		default: false,
		type: "boolean"
	}).argv;

// --- Conditional Logger ---
const debugLog = (...args) => {
	if (argv.debug) {
		console.log(...args);
	}
};

console.log("Starting server script...");

// --- Worker Setup (No changes) ---
let workerReady = false;
const requestQueue = [];
const pendingRequests = new Map();
let requestIdCounter = 0;

debugLog("Creating renderer worker...");
const rendererWorker = new Worker(path.resolve(__dirname, "renderer.js"), {
	workerData: {
		width: argv.width,
		debug: argv.debug,
		earthDayPath: path.resolve(__dirname, "earth_day.png"),
		earthNightPath: path.resolve(__dirname, "earth_night.png")
	}
});

rendererWorker.on("message", ({ id, pixels, error, ready }) => {
	if (error) {
		console.error("!!! Worker thread reported a setup error:", error);
		console.error("!!! The server cannot continue. Exiting.");
		process.exit(1);
	}

	if (ready) {
		debugLog(">>> Main thread received 'ready' signal from worker.");
		workerReady = true;
		if (requestQueue.length > 0) {
			debugLog(`Worker is ready, processing ${requestQueue.length} queued requests...`);
			requestQueue.forEach((job) => rendererWorker.postMessage(job));
			requestQueue.length = 0;
		}
		return;
	}

	if (pendingRequests.has(id)) {
		debugLog(`<<< Main thread received result for job ID: ${id}`);
		const { resolve } = pendingRequests.get(id);
		resolve(pixels);
		pendingRequests.delete(id);
	}
});

rendererWorker.on("error", (err) => {
	console.error("!!! Renderer worker encountered a fatal error:", err);
	process.exit(1);
});

// --- Express Application Setup (No changes) ---
const app = express();

app.get("/", async (req, res) => {
	debugLog(`\n--- Received GET / request with query:`, { ...req.query });
	const { lat, lon } = req.query;
	const parsedLat = parseFloat(lat);
	const parsedLon = parseFloat(lon);

	if (isNaN(parsedLat) || isNaN(parsedLon)) {
		debugLog("--- Invalid parameters. Sending 400 error.");
		return res.status(400).json({ error: "Invalid or missing lat/lon parameters" });
	}

	try {
		const id = requestIdCounter++;
		const promise = new Promise((resolve, reject) => {
			pendingRequests.set(id, { resolve, reject });
		});

		const job = { id, lat: parsedLat, lon: parsedLon };

		if (workerReady) {
			debugLog(`>>> Worker is ready. Sending job ${id} immediately.`);
			rendererWorker.postMessage(job);
		} else {
			debugLog(`--- Worker not ready. Queuing job ${id}.`);
			requestQueue.push(job);
		}

		debugLog(`--- Main thread is now awaiting promise for job ${id}...`);
		const pixels = await promise;
		debugLog(`--- Promise resolved for job ${id}. Encoding PNG...`);

		const pngBuffer = await sharp(Buffer.from(pixels), {
			raw: {
				width: argv.width,
				height: argv.width / 2,
				channels: 4
			}
		})
			.png()
			.toBuffer();

		debugLog(`--- PNG encoded. Sending image response for job ${id}.`);
		res.setHeader("Content-Type", "image/png");
		res.send(pngBuffer);
	} catch (err) {
		console.error("!!! Failed to process render request:", err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.listen(argv.port, argv.address, () => {
	console.log(`Server listening on http://${argv.address}:${argv.port}`);
	debugLog("Waiting for renderer worker to signal readiness...");
});
