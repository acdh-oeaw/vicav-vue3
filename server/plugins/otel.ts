/* eslint-disable @typescript-eslint/no-unused-vars */
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";

export default defineNitroPlugin((nitro) => {
	const sdk = new NodeSDK({
		traceExporter: new ConsoleSpanExporter(),
		metricReader: new PeriodicExportingMetricReader({
			exporter: new ConsoleMetricExporter(),
		}),
		instrumentations: [getNodeAutoInstrumentations()],
	});
});
