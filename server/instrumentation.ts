import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { type ExportResult, ExportResultCode, hrTimeToMicroseconds } from "@opentelemetry/core";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { RuntimeNodeInstrumentation } from "@opentelemetry/instrumentation-runtime-node";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
	AggregationTemporality,
	type AggregationTemporalitySelector,
	type InstrumentType,
	MeterProvider,
	PeriodicExportingMetricReader,
	type PushMetricExporter,
	type ResourceMetrics,
} from "@opentelemetry/sdk-metrics";
import {
	BatchSpanProcessor,
	NodeTracerProvider,
	type ReadableSpan,
	SimpleSpanProcessor,
	type SpanExporter,
} from "@opentelemetry/sdk-trace-node";
import {
	ATTR_HTTP_REQUEST_METHOD,
	ATTR_HTTP_RESPONSE_STATUS_CODE,
	ATTR_SERVER_ADDRESS,
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
	ATTR_URL_FULL,
	ATTR_URL_PATH,
	ATTR_URL_SCHEME,
} from "@opentelemetry/semantic-conventions";

const env = useRuntimeConfig();

/**
 * This is implementation of {@link SpanExporter} that prints spans to the
 * console. This class can be used for diagnostic purposes.
 *
 * NOTE: This {@link SpanExporter} is intended for diagnostics use only, output rendered to the console may change at any time.
 */

/* eslint-disable no-console */
export class PrettyConsoleSpanExporter implements SpanExporter {
	/**
	 * Export spans.
	 * @param spans
	 * @param resultCallback
	 */
	export(spans: Array<ReadableSpan>, resultCallback: (result: ExportResult) => void): void {
		this._sendSpans(spans, resultCallback);
	}

	/**
	 * Shutdown the exporter.
	 */
	shutdown(): Promise<void> {
		this._sendSpans([]);
		return this.forceFlush();
	}

	/**
	 * Exports any pending spans in exporter
	 */
	forceFlush(): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Showing spans in console
	 * @param spans
	 * @param done
	 */
	private _sendSpans(spans: Array<ReadableSpan>, done?: (result: ExportResult) => void): void {
		for (const span of spans) {
			console.info(`${span.resource.attributes[ATTR_SERVICE_NAME]?.toString() ?? "unknown service"} \
v${span.resource.attributes[ATTR_SERVICE_VERSION]?.toString() ?? "unknown version"}:\
 ${span.attributes[ATTR_HTTP_REQUEST_METHOD]?.toString() ?? ""}\
 ${span.attributes[ATTR_URL_SCHEME]?.toString() ?? ""}:/\
/${span.attributes[ATTR_SERVER_ADDRESS]?.toString() ?? ""}\
${span.attributes[ATTR_URL_PATH]?.toString() ?? ""} ->\
 ${span.attributes[ATTR_HTTP_RESPONSE_STATUS_CODE]?.toString() ?? ""}\
 ${span.attributes[ATTR_URL_FULL]?.toString() ?? ""}:\
 took ${(hrTimeToMicroseconds(span.duration) / 1000).toString()} ms\
 Span: (${span.spanContext().traceId}:${span.spanContext().spanId})`);
		}
		if (done) {
			done({ code: ExportResultCode.SUCCESS });
			return;
		}
	}
}

interface PrettyConsoleMetricExporterOptions {
	temporalitySelector?: AggregationTemporalitySelector;
}

const DEFAULT_AGGREGATION_TEMPORALITY_SELECTOR: AggregationTemporalitySelector = (
	_instrumentType,
) => AggregationTemporality.CUMULATIVE;

/**
 * This is an implementation of {@link PushMetricExporter} that prints metrics to the
 * console. This class can be used for diagnostic purposes.
 *
 * NOTE: This {@link PushMetricExporter} is intended for diagnostics use only, output rendered to the console may change at any time.
 */

/* eslint-disable no-console */
export class PrettyConsoleMetricExporter implements PushMetricExporter {
	protected _shutdown = false;
	protected _temporalitySelector: AggregationTemporalitySelector;

	constructor(options?: PrettyConsoleMetricExporterOptions) {
		this._temporalitySelector =
			options?.temporalitySelector ?? DEFAULT_AGGREGATION_TEMPORALITY_SELECTOR;
	}

	export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): void {
		if (this._shutdown) {
			// If the exporter is shutting down, by spec, we need to return FAILED as export result
			setImmediate(resultCallback, { code: ExportResultCode.FAILED });
			return;
		}

		PrettyConsoleMetricExporter._sendMetrics(metrics, resultCallback);
	}

	forceFlush(): Promise<void> {
		return Promise.resolve();
	}

	selectAggregationTemporality(_instrumentType: InstrumentType): AggregationTemporality {
		return this._temporalitySelector(_instrumentType);
	}

	shutdown(): Promise<void> {
		this._shutdown = true;
		return Promise.resolve();
	}

	private static _sendMetrics(
		metrics: ResourceMetrics,
		done: (result: ExportResult) => void,
	): void {
		for (const scopeMetrics of metrics.scopeMetrics) {
			for (const metric of scopeMetrics.metrics.filter(
				(m) => m.descriptor.name === "v8js.memory.heap.used",
				//||	m.descriptor.name === 'v8js.memory.heap.space.available_size'
			)) {
				console.info(`${metrics.resource.attributes[ATTR_SERVICE_NAME]?.toString() ?? "unknown service"} \
v${metrics.resource.attributes[ATTR_SERVICE_VERSION]?.toString() ?? "unknown version"}:\
 Metric: ${metric.descriptor.name},\
 Data Points: ${JSON.stringify(
		metric.dataPoints.map((dp) => {
			return {
				...{ space: dp.attributes["v8js.heap.space.name"]?.toString() ?? "unknown space" },
				...{ value: dp.value },
			};
		}),
 )}`);
			}
		}

		done({ code: ExportResultCode.SUCCESS });
	}
}

const contextManager = new AsyncLocalStorageContextManager();
const traceProvider = new NodeTracerProvider({
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: "vicav-vue3",
		[ATTR_SERVICE_VERSION]: env.public.currentGitSha,
	}),
	spanProcessors: [
		new SimpleSpanProcessor(new PrettyConsoleSpanExporter()),
		new BatchSpanProcessor(new OTLPTraceExporter()),
	],
});
traceProvider.register({
	contextManager,
});

const meterProvider = new MeterProvider({
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: "vicav-vue3",
		[ATTR_SERVICE_VERSION]: env.public.currentGitSha,
	}),
	readers: [
		new PeriodicExportingMetricReader({
			exporter: new PrettyConsoleMetricExporter(),
			exportIntervalMillis: 20000,
		}),
		new PeriodicExportingMetricReader({
			exporter: new OTLPMetricExporter(),
			exportIntervalMillis: 5000,
		}),
	],
});

const runtimeInstrumentation = new RuntimeNodeInstrumentation({
	monitoringPrecision: 5000,
});
runtimeInstrumentation.setMeterProvider(meterProvider);

registerInstrumentations({
	instrumentations: [new UndiciInstrumentation(), runtimeInstrumentation],
});
