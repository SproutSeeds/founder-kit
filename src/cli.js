import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runFounderAnimation, shouldAnimate, supportsColor } from "./animation.js";
import {
  addEvidence,
  buildAcquisitionChecklist,
  buildComplianceChecklist,
  buildRenewalCalendar,
  createFounderProfile,
  formatAcquisitionChecklist,
  formatComplianceChecklist,
  formatEvidenceBinder,
  formatInitResult,
  formatRenewalCalendar
} from "./compliance.js";
import { buildDailyBrief, formatDailyBrief } from "./founder-day.js";
import { readFounderState, writeFounderState } from "./storage.js";

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const COMMANDS = new Set(["daily", "init", "scout", "binder", "renewals", "buy-llc"]);
const GLOBAL_FLAGS = new Set(["help", "h", "version", "v", "json", "no-animation", "demo"]);

function normalizeFlagName(name) {
  return name.replace(/^--?/, "");
}

function assignValue(values, key, value) {
  if (key.startsWith("no-")) {
    values[key.slice(3)] = false;
  } else {
    values[key] = value;
  }
}

export function parseArgs(args = []) {
  const options = {
    animation: true,
    command: "daily",
    commandArgs: [],
    demo: false,
    help: false,
    json: false,
    positionals: [],
    values: {},
    version: false
  };

  let commandWasSet = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("-")) {
      if (!commandWasSet && COMMANDS.has(arg)) {
        options.command = arg;
        commandWasSet = true;
      } else {
        options.positionals.push(arg);
      }
      continue;
    }

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
    } else if (arg.startsWith("--")) {
      const [rawName, inlineValue] = arg.slice(2).split(/=(.*)/s);
      const name = normalizeFlagName(rawName);

      if (options.command === "daily" && !GLOBAL_FLAGS.has(name)) {
        throw new Error(`unknown option --${name}`);
      }

      if (inlineValue !== undefined) {
        assignValue(options.values, name, inlineValue);
      } else if (args[index + 1] && !args[index + 1].startsWith("-")) {
        assignValue(options.values, name, args[index + 1]);
        index += 1;
      } else {
        assignValue(options.values, name, true);
      }
    } else {
      throw new Error(`unknown option ${arg}`);
    }
  }

  if (options.command === "daily" && options.positionals.length > 0) {
    throw new Error(`unknown command ${options.positionals[0]}`);
  }

  options.commandArgs = options.positionals;
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
    "  founder init [profile options]",
    "  founder scout [--json]",
    "  founder binder [list|add] [options]",
    "  founder renewals [--json]",
    "  founder buy-llc [--json]",
    "  founder-kit [options]",
    "",
    "Profile options:",
    "  --name <name>                 business name",
    "  --entity <type>               LLC, corporation, sole-prop, etc.",
    "  --formation-state <state>     formation state",
    "  --state <state>               operating state",
    "  --county <county>             operating county",
    "  --city <city>                 operating city",
    "  --address <address>           business location",
    "  --address-type <type>         home, office, retail, warehouse, mobile, online",
    "  --activity <activity>         what the business does",
    "  --regulated <items>           comma-separated regulated categories",
    "  --home-based                 mark as home-based",
    "  --inside-city-limits <bool>   true or false",
    "  --buying                     mark as buying an existing entity",
    "  --data-dir <path>             default: .founder-kit",
    "",
    "Options:",
    "  --demo             force the launch animation",
    "  --json             print JSON when supported",
    "  --no-animation     skip the launch animation",
    "  -v, --version      print the package version",
    "  -h, --help         show this help",
    "",
    "Package: founder-kit",
    "Command: founder"
  ].join("\n");
}

export function commandHelpText(command) {
  if (command === "init") {
    return [
      "founder init",
      "",
      "Create or update .founder-kit/founder.json.",
      "",
      "Example:",
      "  founder init --name \"Acme LLC\" --entity LLC --formation-state FL --state FL --county Orange --city Orlando --address-type home --activity \"AI bookkeeping\" --inside-city-limits true"
    ].join("\n");
  }

  if (command === "binder") {
    return [
      "founder binder",
      "",
      "List evidence or add an official source, filing, license, receipt, or renewal.",
      "",
      "Examples:",
      "  founder binder",
      "  founder binder add --label \"County BTR\" --url https://... --jurisdiction \"Orange County\" --renewal-date 2026-09-30"
    ].join("\n");
  }

  return helpText();
}

function hasProfileInput(values = {}) {
  return [
    "name",
    "entity",
    "entityType",
    "formation-state",
    "formationState",
    "state",
    "county",
    "city",
    "address",
    "location",
    "address-type",
    "addressType",
    "inside-city-limits",
    "insideCityLimits",
    "home-based",
    "homeBased",
    "activity",
    "regulated",
    "regulatedActivities",
    "buying",
    "acquiringExistingEntity",
    "naics"
  ].some((key) => Object.hasOwn(values, key));
}

function storageOptions(options, io) {
  return {
    cwd: io.cwd ?? process.cwd(),
    dataDir: options.values["data-dir"],
    env: io.env ?? process.env
  };
}

async function loadProfile(options, io, allowInput = true) {
  const storage = storageOptions(options, io);
  const existing = await readFounderState(storage);

  if (allowInput && hasProfileInput(options.values)) {
    return createFounderProfile(options.values, existing ?? {});
  }

  if (!existing) {
    throw new Error("no founder profile found; run `founder init --name ... --state ... --county ... --activity ...` first");
  }

  return existing;
}

async function handleInit(options, io, stdout) {
  const storage = storageOptions(options, io);
  const existing = await readFounderState(storage);
  const profile = createFounderProfile(options.values, existing ?? {});
  const statePath = await writeFounderState(profile, storage);

  if (options.json) {
    stdout.write(`${JSON.stringify(profile, null, 2)}\n`);
  } else {
    stdout.write(`${formatInitResult(profile, statePath)}\n`);
  }
}

async function handleScout(options, io, stdout) {
  const profile = await loadProfile(options, io);
  const result = buildComplianceChecklist(profile);

  if (options.json) {
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    stdout.write(`${formatComplianceChecklist(result)}\n`);
  }
}

async function handleBuyLlc(options, io, stdout) {
  const profile = await loadProfile(options, io);
  const result = buildAcquisitionChecklist(profile);

  if (options.json) {
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    stdout.write(`${formatAcquisitionChecklist(result)}\n`);
  }
}

async function handleBinder(options, io, stdout) {
  const action = options.positionals[0] ?? "list";
  const storage = storageOptions(options, io);
  const profile = await loadProfile(options, io, false);

  if (action === "add") {
    const input = {
      ...options.values,
      _text: options.positionals.slice(1).join(" ")
    };
    const updated = addEvidence(profile, input);
    await writeFounderState(updated, storage);

    if (options.json) {
      stdout.write(`${JSON.stringify(updated.evidence.at(-1), null, 2)}\n`);
    } else {
      stdout.write(`\nEvidence added: ${updated.evidence.at(-1).label}\nNext: founder binder\n`);
    }
    return;
  }

  if (options.json) {
    stdout.write(`${JSON.stringify(profile.evidence ?? [], null, 2)}\n`);
  } else {
    stdout.write(`${formatEvidenceBinder(profile)}\n`);
  }
}

async function handleRenewals(options, io, stdout) {
  const profile = await loadProfile(options, io);
  const result = buildRenewalCalendar(profile);

  if (options.json) {
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    stdout.write(`${formatRenewalCalendar(result)}\n`);
  }
}

export async function runFounderKitCli(args = [], io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const env = io.env ?? process.env;
  const options = parseArgs(args);

  if (options.help) {
    stdout.write(`${commandHelpText(options.command)}\n`);
    return;
  }

  if (options.version) {
    stdout.write(`${getPackageVersion()}\n`);
    return;
  }

  if (options.command === "init") {
    await handleInit(options, io, stdout);
    return;
  }

  if (options.command === "scout") {
    await handleScout(options, io, stdout);
    return;
  }

  if (options.command === "binder") {
    await handleBinder(options, io, stdout);
    return;
  }

  if (options.command === "renewals") {
    await handleRenewals(options, io, stdout);
    return;
  }

  if (options.command === "buy-llc") {
    await handleBuyLlc(options, io, stdout);
    return;
  }

  if (!COMMANDS.has(options.command)) {
    throw new Error(`unknown command ${options.command}`);
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
