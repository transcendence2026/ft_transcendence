

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const method = request.method;
    // Usamos la ruta limpia si está disponible, o la URL
    const route = request.route?.path || request.url;

    // Iniciar el cronómetro del histograma de latencia
    const endTimer = this.metricsService.httpRequestDurationSeconds.startTimer({
      method,
      route,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = response.statusCode.toString();
          
          // Detener el cronómetro y registrar latencia con su código de estado
          endTimer({ status_code: statusCode });

          // Incrementar también el contador de peticiones por código
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
        },
        error: (err) => {
          const statusCode = (err.status || 500).toString();
          
          // Registrar la latencia incluso si hubo un error (ej. 401 o 500)
          endTimer({ status_code: statusCode });

          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
        },
      }),
    );
  }
}