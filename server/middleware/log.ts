import pino from "pino-http";

const logger = pino({
	quietReqLogger: true,
	transport: {
		target: "pino-http-print",
		options: {
			destination: 1,
			all: true,
			colorize: false,
			translateTime: true,
		},
	},
});

export default defineEventHandler((event) => {
	logger(event.node.req, event.node.res);
});
