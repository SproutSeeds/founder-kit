import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runFounderAnimation, shouldAnimate, supportsColor } from "./animation.js";
import { buildDailyBrief, formatDailyBrief } from "./founder-day.js";

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

export function parseArgs(args = []) {
  const options = {
    animation: true,
    demo: false,
    help: false,
    json: false,
    version: false
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--version" || arg === "-v") {
      options.version = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--no-animation") {
      options.animation = false;
    } else if (arg === "--demo") {
      options.demo = true;
    } else {
      throw new Error(`unknown option ${arg}`);
    }
  }

  return options;
}

export function getPackageVersion() {
  const pkg = JSON.parse(readFileSync(join(ROOT_DIR, "package.json"), "utf8"));
  return pkg.version;
}

export function helpText() {
  return [
    "founder-kit",
    "",
    "Usage:",
    "  founder [options]",
    "  founder-kit [options]",
    "",
    "Options:",
    "  --demo             force the launch animation",
    "  --json             print the daily founder loop as JSON",
    "  --no-animation     skip the launch animation",
    "  -v, --version      print the package version",
    "  -h, --help         show this help",
    "",
    "Package: founder-kit",
    "Command: founder"
  ].join("\n");
}

export async function runFounderKitCli(args = [], io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const env = io.env ?? process.env;
  const options = parseArgs(args);

  if (options.help) {
    stdout.write(`${helpText()}\n`);
    return;
  }

  if (options.version) {
    stdout.write(`${getPackageVersion()}\n`);
    return;
  }

  const brief = buildDailyBrief();

  if (options.json) {
    stdout.write(`${JSON.stringify(brief, null, 2)}\n`);
    return;
  }

  if (options.animation && shouldAnimate(stdout, env, options.demo)) {
    await runFounderAnimation({
      color: supportsColor(stdout, env),
      intervalMs: options.demo ? 120 : 80,
      stdout
    });
  }

  stdout.write(`${formatDailyBrief(brief)}\n`);

  if (!stdout.isTTY && options.demo) {
    stderr.write("founder-kit: demo animation was rendered to a non-TTY stream\n");
  }
}
