declare module '@nestjs/websockets' {
  export class AbstractWsAdapter {
    constructor(appOrHttpServer?: unknown);
  }

  export function ConnectedSocket(): ParameterDecorator;
  export function MessageBody(): ParameterDecorator;
  export function SubscribeMessage(message: string): MethodDecorator;
  export function WebSocketGateway(...args: unknown[]): ClassDecorator;
}
