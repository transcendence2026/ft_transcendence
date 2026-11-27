import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';
import { Counter, Histogram } from 'prom-client';

    @Injectable()
    export class MetricsService {
    private readonly registry: client.Registry;
    public readonly httpRequestDurationSeconds: client.Histogram<string>;
    public readonly httpRequestsTotal: client.Counter<string>;
    public readonly httpUploadBytesTotal: client.Counter<string>;

    constructor() {
        this.registry = new client.Registry();

        // Recolectar métricas por defecto de Node.js (memoria, CPU, etc.)
        client.collectDefaultMetrics({ register: this.registry });

        // 1. Histograma para medir la latencia HTTP
        this.httpRequestDurationSeconds = new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        // Rangos de tiempo (buckets) ideales para latencia web (desde 5ms hasta 5s)
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
        registers: [this.registry],
        });

        // 2. Contador de peticiones (necesario para complementar la latencia)
        this.httpRequestsTotal = new client.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests, by method, route and status code',
        //method = GET, POST,
        labelNames: ['method', 'route', 'status_code'],
        registers: [this.registry],
        });

        // 3. Subidas totales y tamaño
        this.httpUploadBytesTotal = new client.Counter({
            name: 'http_upload_bytes_total',
            help: 'Total of bytes from the uploads',
            labelNames: ['route'],
            registers: [this.registry],
        });
    }

    // Método para que Prometheus pueda leer las métricas
    async getMetrics(): Promise<string> {
        return this.registry.metrics();
    }
}
