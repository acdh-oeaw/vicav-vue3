import { useCompression } from "h3-compression";

export default defineNitroPlugin((nitro) => {
	nitro.hooks.hook("render:response", async (response, { event }) => {
		await useCompression(event, response);
	});
});
