import pino from "pino-http";

const logger = pino();

export default defineEventHandler((event) => {
	logger(event.node.req, event.node.res);
});
