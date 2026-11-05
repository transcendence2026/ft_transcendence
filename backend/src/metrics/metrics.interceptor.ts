import { Injectable, NestInterceptor, ExecutionContext, CallHandler,} from '@nestjs/common';
import { tap } from 'rxjs';
import { MetricsService } from './metrics.service';

const IGNORED_ROUTES = ['/metrics', '/api/health'];


@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  
  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    //ignore metrics from /api/health and /metrics
    if (IGNORED_ROUTES.includes(request.route?.path)) {
        return next.handle();   // pasa sin medir nada
    }

    return next.handle().pipe(
      tap(() => {
        this.metricsService.httpRequestsTotal.inc({
          method: request.method,
          route: request.route?.path,
          status_code: String(response.statusCode),
        });
      }),
    );
  }
}