import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "src", "generated", "prisma");
const target = path.join(root, "dist", "generated", "prisma");

function copyDirectory(from, to) {
  fs.mkdirSync(to, { recursive: true });

  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name.includes(".tmp")) continue;

    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

if (!fs.existsSync(source)) {
  throw new Error("Prisma client not found. Run pnpm prisma generate before building.");
}

fs.rmSync(target, { recursive: true, force: true });
copyDirectory(source, target);
