import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace } from '@opentelemetry/api';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function initTracing() {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'commonly-bff';
  const provider = new NodeTracerProvider({
    resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: serviceName })
  });

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (otlpEndpoint) {
    const exporter = new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` });
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  }

  provider.register();
  return trace.getTracer(serviceName);
} 