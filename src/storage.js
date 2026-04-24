import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export const STATE_FILE_NAME = "founder.json";

export function resolveDataDir(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const explicit = options.dataDir ?? env.FOUNDER_KIT_DIR;

  return resolve(cwd, explicit || ".founder-kit");
}

export function resolveStatePath(options = {}) {
  return join(resolveDataDir(options), STATE_FILE_NAME);
}

export async function readFounderState(options = {}) {
  try {
    const raw = await readFile(resolveStatePath(options), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function writeFounderState(state, options = {}) {
  const dataDir = resolveDataDir(options);
  await mkdir(dataDir, { recursive: true });
  await writeFile(resolveStatePath(options), `${JSON.stringify(state, null, 2)}\n`);
  return resolveStatePath(options);
}
