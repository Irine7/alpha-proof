import { spawnSync } from "node:child_process";

const allowLockedClient = process.argv.includes("--allow-locked-client");
const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const result = spawnSync(pnpmBin, ["exec", "prisma", "generate"], {
  encoding: "utf8",
  shell: process.platform === "win32",
  stdio: ["inherit", "pipe", "pipe"]
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status === 0) {
  process.exit(0);
}

const output = `${result.stdout || ""}\n${result.stderr || ""}`;
const isLockedPrismaClient =
  output.includes("EPERM") &&
  output.includes("query_engine-windows.dll.node") &&
  output.includes("rename");

if (allowLockedClient && isLockedPrismaClient) {
  console.warn(
    [
      "",
      "Prisma Client generation was skipped because Windows reports the query engine DLL is locked.",
      "Stop any running backend/dev Node processes, then run:",
      "",
      "  pnpm --filter @alphaproof/backend db:generate",
      ""
    ].join("\n")
  );
  process.exit(0);
}

process.exit(result.status || 1);
