// server.js
const express = require("express");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { Worker } = require("worker_threads");
const path = require("path");
const sharp = require("sharp");

console.log("Starting server script...");

const argv = yargs(hideBin(process.argv))
	.option("p", { alias: "port", default: 3000 })
	.option("a", { alias: "address", default: "127.0.0.1" })
	.option("w", { alias: "width", default: 1400 }).argv;

let workerReady = false;
const requestQueue = [];
const pendingRequests = new Map();
let requestIdCounter = 0;

console.log("Creating renderer worker...");
const rendererWorker = new Worker(path.resolve(__dirname, "renderer.js"), {
	workerData: {
		width: argv.width,
		earthDayPath: path.resolve(__dirname, "earth_day.png"),
		earthNightPath: path.resolve(__dirname, "earth_night.png")
	}
});

rendererWorker.on("message", ({ id, pixels, error, ready }) => {
	// --- THE FIX IS HERE ---
	// Check for an error message FIRST.
	if (error) {
		console.error("!!! Worker thread reported a setup error:", error);
		console.error("!!! The server cannot continue. Exiting.");
		process.exit(1);
	}

	if (ready) {
		console.log(">>> Main thread received 'ready' signal from worker.");
		workerReady = true;
		if (requestQueue.length > 0) {
			console.log(`Worker is ready, processing ${requestQueue.length} queued requests...`);
			requestQueue.forEach((job) => rendererWorker.postMessage(job));
			requestQueue.length = 0;
		}
		return;
	}

	if (pendingRequests.has(id)) {
		const { resolve, reject } = pendingRequests.get(id);
		resolve(pixels); // Errors are now handled above
		pendingRequests.delete(id);
	}
});

rendererWorker.on("error", (err) => {
	console.error("!!! Renderer worker encountered a fatal error:", err);
	process.exit(1);
});

const app = express();

app.get("/", async (req, res) => {
	const { lat, lon } = req.query;
	const parsedLat = parseFloat(lat);
	const parsedLon = parseFloat(lon);

	if (isNaN(parsedLat) || isNaN(parsedLon)) {
		return res.status(400).json({ error: "Invalid or missing lat/lon parameters" });
	}

	try {
		const id = requestIdCounter++;
		const promise = new Promise((resolve, reject) => {
			pendingRequests.set(id, { resolve, reject });
		});

		const job = { id, lat: parsedLat, lon: parsedLon };

		if (workerReady) {
			rendererWorker.postMessage(job);
		} else {
			requestQueue.push(job);
		}

		const pixels = await promise;

		const pngBuffer = await sharp(Buffer.from(pixels), {
			raw: {
				width: argv.width,
				height: argv.width / 2,
				channels: 4
			}
		})
			.png()
			.toBuffer();

		res.setHeader("Content-Type", "image/png");
		res.send(pngBuffer);
	} catch (err) {
		console.error("!!! Failed to process render request:", err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.listen(argv.port, argv.address, () => {
	console.log(`Server listening on http://${argv.address}:${argv.port}`);
	console.log("Waiting for renderer worker to signal readiness...");
});
