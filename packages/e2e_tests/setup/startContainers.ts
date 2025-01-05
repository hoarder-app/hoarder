import { execSync } from "child_process";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import type { GlobalSetupContext } from "vitest/node";

async function getRandomPort(): Promise<number> {
  const server = net.createServer();
  return new Promise<number>((resolve, reject) => {
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHealthy(port: number, timeout = 60000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.status === 200) {
        return;
      }
    } catch (error) {
      // Ignore errors and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Health check failed after ${timeout}ms`);
}

export default async function ({ provide }: GlobalSetupContext) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const port = await getRandomPort();

  console.log(`Starting docker compose on port ${port}...`);
  execSync(`docker compose up --build -d`, {
    cwd: __dirname,
    stdio: "inherit",
    env: {
      ...process.env,
      HOARDER_PORT: port.toString(),
    },
  });

  console.log("Waiting for service to become healthy...");
  await waitForHealthy(port);

  // Wait 5 seconds for the worker to start
  await new Promise((resolve) => setTimeout(resolve, 5000));

  provide("hoarderPort", port);

  process.env.HOARDER_PORT = port.toString();

  return async () => {
    console.log("Stopping docker compose...");
    execSync("docker compose down", {
      cwd: __dirname,
      stdio: "inherit",
    });
    return Promise.resolve();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    hoarderPort: number;
  }
}
