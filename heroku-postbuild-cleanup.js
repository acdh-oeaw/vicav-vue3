import { glob, rm } from "node:fs/promises";
import { exit } from "node:process";

if (process.env.CI === undefined) {
	console.warn(
		"This script should only be run in a CI environment. It removes all source files after building the project.",
	);
	exit(0);
}

await (async () => {
	for await (const entry of glob("*")) {
		if (entry === "heroku-postbuild-cleanup.js" || entry === "package.json") {
			continue;
		}
		try {
			await rm(entry, { force: true, recursive: true });
		} catch (error) {
			console.error(error);
		}
	}
	for await (const entry of glob(".*")) {
		if (entry === ".output") {
			continue;
		}
		try {
			await rm(entry, { force: true, recursive: true });
		} catch (error) {
			console.error(error);
		}
	}
})();
