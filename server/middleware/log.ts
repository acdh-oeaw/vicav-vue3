import { ecsFormat } from "@elastic/ecs-pino-format";
import { type LoggerOptions, pino } from "pino";

const logger = pino(ecsFormat({ convertReqRes: true }) as LoggerOptions);

export default defineEventHandler((event) => {
	logger.info({ req: event.node.req, res: event.node.res }, `Handled request`);
});
