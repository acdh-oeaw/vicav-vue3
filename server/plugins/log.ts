import { ecsFormat } from "@elastic/ecs-pino-format";
import { type LoggerOptions, pino } from "pino";

const logger = pino(ecsFormat({ convertReqRes: true }) as LoggerOptions);

export default defineNitroPlugin((nitro) => {
	nitro.hooks.hook("render:response", (_, { event }) => {
		logger.info({ req: event.node.req, res: event.node.res }, `Handled request`);
	});
});
