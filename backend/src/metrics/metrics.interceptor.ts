import { Injectable, NestInterceptor, HttpException, ExecutionContext, CallHandler,} from '@nestjs/common';
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

        const endTimer = this.metricsService.httpRequestDurationSeconds.startTimer({ method:request.method, route: request.route?.path });

        //start timer
        return next.handle().pipe(
            tap({
                next: () => {
                    this.metricsService.httpRequestsTotal.inc({
                    method: request.method,
                    route: request.route?.path,
                    status_code: String(response.statusCode),
                    });
                    endTimer({ status_code: String(response.statusCode) })
                    if(request.file) {
                        this.metricsService.httpUploadBytesTotal.inc({
                            route: request.route?.path,
                        },
                            request.file.size,
                        )
                    }
                    //endtimer
                },
                error: (err) => {
                    
                    // 1. decide the status number:
                    //    if err is an HttpException -> use its status
                    //    otherwise                  -> use a fallback number
                    const status = err instanceof HttpException ? err.getStatus() : '500';

                    endTimer({ status_code: String(status) })
                    // 2. same inc as in next, but with this status as a string
                    this.metricsService.httpRequestsTotal.inc({
                        method: request.method,
                        route: request.route?.path,
                        status_code: String(status),
                    }); 
                    //endtimer      
                },
            })
        );
    }   
}


//https://medium.com/@islam.farid16/monitoring-a-nestjs-application-with-prometheus-and-grafana-31436a495d0e