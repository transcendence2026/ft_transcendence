  import { spawn } from 'node:child_process';
  import { randomUUID } from 'node:crypto';
  import { dirname, resolve } from 'node:path';
  import { setTimeout as sleep } from 'node:timers/promises';
  import { fileURLToPath } from 'node:url';
  import WebSocket from 'ws';

  const clientCount = Number.parseInt(process.env.WS_STRESS_CLIENTS ?? '50', 10);
  const apiUrl = process.env.WS_STRESS_API_URL ?? 'http://localhost:3000';
  const websocketUrl = process.env.WS_STRESS_URL ?? `${apiUrl.replace(/^http/, 'ws')}/`;
  const roomName = process.env.WS_STRESS_ROOM ?? `stress-room-${Date.now()}`;
  let tokens = (process.env.WS_STRESS_TOKENS ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  const timeoutMs = 10_000;
  const startupTimeoutMs = 120_000;
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const composeFile = resolve(
    repositoryRoot,
    process.env.WS_STRESS_COMPOSE_FILE ?? 'docker-compose-dev.yml',
  );

  if (!Number.isInteger(clientCount) || clientCount < 2) {
    throw new Error('WS_STRESS_CLIENTS must be an integer greater than or equal to 2');
  }

  type StressClient = {
    socket: WebSocket;
    token: string;
    messages: string[];
  };

  function waitForMessage(client: StressClient, predicate: (message: string) => boolean, description: string): Promise<void> {
    const matchingMessage = client.messages.find(predicate);
    if (matchingMessage) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(
        `Timed out waiting for ${description}. Recent messages: ${client.messages.slice(-3).join(' | ') || 'none'}`,
      )), timeoutMs);
      const handleMessage = (raw: WebSocket.RawData) => {
        const message = raw.toString();
        if (predicate(message)) {
          clearTimeout(timeout);
          client.socket.off('message', handleMessage);
          resolve();
        }
      };
      const handleClose = (code: number, reason: Buffer) => {
        clearTimeout(timeout);
        client.socket.off('message', handleMessage);
        reject(new Error(`WebSocket closed before ${description}: code ${code} (${reason.toString()})`));
      };

      client.socket.on('message', handleMessage);
      client.socket.once('close', handleClose);
      client.socket.once('error', (error) => {
        clearTimeout(timeout);
        client.socket.off('message', handleMessage);
        reject(error);
      });
    });
  }

  function waitForOpen(socket: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket connection timed out')), timeoutMs);
      socket.once('open', () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  function waitForRoomMessage(client: StressClient, expectedMessage: string): Promise<void> {
    return waitForMessage(client, (message) => message === expectedMessage, expectedMessage);
  }

  async function connect(token: string): Promise<StressClient> {
    const socket = new WebSocket(`${websocketUrl}?token=${encodeURIComponent(token)}`);
    const client: StressClient = { socket, token, messages: [] };
    socket.on('message', (raw) => client.messages.push(raw.toString()));
    await waitForOpen(socket);
    await waitForMessage(client, (message) => message === 'Bienvenido al WebSocket !', 'WebSocket authentication');
    return client;
  }

  async function joinRoom(client: StressClient) {
    client.socket.send(JSON.stringify({
      event: 'joinRoom',
      data: { roomName },
    }));
    await waitForMessage(
      client,
      (message) => {
        try {
          const parsed = JSON.parse(message) as {
            event?: string;
            data?: { roomName?: string; event?: string; data?: { roomName?: string } };
          };
          return (
            (parsed.event === 'room:joined' && parsed.data?.roomName === roomName)
            || (
              parsed.event === 'joinRoom'
              && parsed.data?.event === 'room:joined'
              && parsed.data.data?.roomName === roomName
            )
          );
        } catch {
          return false;
        }
      },
      `room join acknowledgement for ${roomName}`,
    );
  }

  function close(client: StressClient) {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.close();
    }
  }

  async function isApiAvailable() {
    try {
      const response = await fetch(`${apiUrl}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  function startCompose(): Promise<void> {
    console.log(`WebSocket stress test: starting services with ${composeFile}...`);
    const composeProcess = spawn(
      'docker',
      ['compose', '-f', composeFile, 'up', '-d', '--build', 'db', 'backend'],
      { cwd: repositoryRoot, stdio: 'inherit' },
    );
    return new Promise((resolve, reject) => {
      composeProcess.on('error', (error) => {
        reject(new Error(`Unable to start Docker Compose: ${error.message}`));
      });
      composeProcess.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Docker Compose exited with code ${code ?? 'unknown'}`));
      });
    });
  }

  async function waitForApi() {
    const deadline = Date.now() + startupTimeoutMs;
    while (Date.now() < deadline) {
      if (await isApiAvailable()) return;
      await sleep(2_000);
    }
    throw new Error(`Backend did not become ready at ${apiUrl} within ${startupTimeoutMs / 1000}s`);
  }

  async function createStressToken() {
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: `websocket-stress-${suffix}@example.test`,
        username: `ws_stress_${suffix}`,
        password: `Stress-${randomUUID()}-Aa1!`,
      }),
    });

    const body = await response.json() as { accessToken?: string; token?: string; message?: string };
    if (!response.ok) {
      throw new Error(`Unable to create stress user (${response.status}): ${body.message ?? 'unknown error'}`);
    }

    const token = body.accessToken ?? body.token;
    if (!token) {
      throw new Error('Stress user registration did not return an access token');
    }
    return token;
  }

  async function prepareEnvironment() {
    if (tokens.length > 0) return;

    if (!(await isApiAvailable())) {
      await startCompose();
      await waitForApi();
    }

    const token = await createStressToken();
    tokens = [token];
    console.log(`WebSocket stress test: using ${clientCount} sockets with an automatic test account.`);
  }

  async function main() {
    await prepareEnvironment();

    const clients = await Promise.all(
      Array.from({ length: clientCount }, (_, index) => connect(tokens[index % tokens.length])),
    );

    await Promise.all(clients.map(joinRoom));

    const firstBroadcast = Promise.all(
      clients.slice(1).map((client) => waitForRoomMessage(client, 'websocket-stress-message')),
    );
    clients[0].socket.send(JSON.stringify({
      event: 'message',
      data: { roomName, message: 'websocket-stress-message' },
    }));
    await firstBroadcast;

    const reconnectingClients = clients.slice(0, Math.ceil(clientCount / 5));
    reconnectingClients.forEach(close);
    const reconnectedClients = await Promise.all(reconnectingClients.map((client) => connect(client.token)));
    await Promise.all(reconnectedClients.map(joinRoom));

    const reconnectBroadcast = Promise.all(
      reconnectedClients.slice(1).map((client) => waitForRoomMessage(client, 'websocket-reconnect-message')),
    );
    reconnectedClients[0].socket.send(JSON.stringify({
      event: 'message',
      data: { roomName, message: 'websocket-reconnect-message' },
    }));
    await reconnectBroadcast;

    [...clients.slice(reconnectingClients.length), ...reconnectedClients].forEach(close);
    console.log(`WebSocket stress test passed: ${clientCount} clients, room broadcast, and reconnection flow.`);
  }

  main().catch((error) => {
    console.error('WebSocket stress test failed:', error);
    process.exitCode = 1;
  });
