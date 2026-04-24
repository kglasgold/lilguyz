import { spawn } from "node:child_process";

const children = [
  spawn("node", ["server/index.js"], {
    stdio: "inherit",
    shell: false,
  }),
  spawn("npx", ["vite", "--host", "127.0.0.1"], {
    stdio: "inherit",
    shell: false,
  }),
];

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (signal) {
      shutdown(signal);
      return;
    }

    if (code && code !== 0) {
      shutdown("SIGTERM", code);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function shutdown(signal, exitCode = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }

  process.exitCode = exitCode;
}
