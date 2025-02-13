import { glob, rm } from "node:fs/promises";
import { exit } from "node:process";

if (process.env.CI === undefined) {
	console.warn(
		"This script should only be run in a CI environment. It removes all source files after building the project.",
	);
	exit(0);
}

if (process.env.NODE_ENV !== "production") {
	exit(0);
}

await (async () => {
	for await (const entry of glob("*")) {
		if (
			entry === "heroku-postbuild-cleanup.js" ||
			entry === "package.json" ||
			entry === "pnpm-lock.yaml"
		) {
			continue;
		}
		try {
			await rm(entry, { force: true, recursive: true });
		} catch (error) {
			console.error(error);
		}
	}
	for await (const entry of glob(".*")) {
		if (entry === ".output" || entry === ".heroku" || entry === ".profile.d") {
			continue;
		}
		try {
			await rm(entry, { force: true, recursive: true });
		} catch (error) {
			console.error(error);
		}
	}
	for await (const entry of glob(".heroku/node/include")) {
		try {
			await rm(entry, { force: true, recursive: true });
		} catch (error) {
			console.error(error);
		}
	}
})();
