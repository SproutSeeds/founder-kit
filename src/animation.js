const ANSI = {
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  hideCursor: "\x1b[?25l",
  reset: "\x1b[0m",
  showCursor: "\x1b[?25h",
  yellow: "\x1b[33m"
};

const PHASES = ["signal", "brief", "agent", "ship", "cadence"];
const MARKERS = [">", ">>", ">>>", ">>>>", ">>>>>"];
const PANEL_WIDTH = 62;
export const MASCOT_NAME = "Scout-01";

const BOOT_FRAMES = [
  {
    mode: "signal radar",
    command: "scout scan --buyers",
    output: "signal.log -> one pain, one payer, one open question"
  },
  {
    mode: "founder brief",
    command: "scout brief --constraint",
    output: "brief.md   -> bottleneck named, owner assigned"
  },
  {
    mode: "agent dispatch",
    command: "scout run --agent",
    output: "agent.bus  -> task queued, evidence required"
  },
  {
    mode: "ship loop",
    command: "scout ship --smallest-move",
    output: "release    -> customer-facing move prepared"
  },
  {
    mode: "cadence lock",
    command: "scout log --next-review",
    output: "cadence.db -> result, owner, review time saved"
  }
];

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function supportsColor(stream, env = process.env) {
  if (env.NO_COLOR) return false;
  if (env.FORCE_COLOR && env.FORCE_COLOR !== "0") return true;
  return Boolean(stream?.isTTY);
}

export function shouldAnimate(stream, env = process.env, force = false) {
  if (force) return true;
  if (!stream?.isTTY) return false;
  if (env.CI || env.NO_ANIMATION) return false;
  return true;
}

export function colorize(value, color, enabled = true) {
  if (!enabled) return value;
  return `${ANSI[color] ?? ""}${value}${ANSI.reset}`;
}

function renderPanelLine(value, color, enabled) {
  return `| ${colorize(value.padEnd(PANEL_WIDTH, " "), color, enabled)} |`;
}

export function renderFounderFrame(step = 0, options = {}) {
  const color = options.color ?? false;
  const active = step % PHASES.length;
  const frame = BOOT_FRAMES[active];
  const phaseLine = PHASES.map((phase, index) => {
    const label = index === active ? colorize(phase.toUpperCase(), "green", color) : phase;
    return `[${label}]`;
  }).join("--");
  const activeOffset = PHASES.slice(0, active).reduce((offset, phase) => offset + phase.length + 4, 1);
  const marker = `${" ".repeat(activeOffset)}${colorize(MARKERS[step % MARKERS.length], "yellow", color)}`;
  const pulse = "#".repeat((step % 5) + 1).padEnd(5, ".");
  const border = `+${"-".repeat(PANEL_WIDTH + 2)}+`;
  const mode = `${MASCOT_NAME} :: ${frame.mode}`;
  const command = `$ ${frame.command}`;
  const flow = `boot [${pulse}]  intent -> agent task -> revenue signal`;

  return [
    colorize("FOUNDER-KIT // AGENT-FIRST OPS", "bold", color),
    colorize(`${MASCOT_NAME} is the retro terminal mascot for delegated founder work`, "dim", color),
    border,
    renderPanelLine(mode, "cyan", color),
    renderPanelLine(command, "green", color),
    renderPanelLine(flow, "yellow", color),
    border,
    frame.output,
    phaseLine,
    marker
  ].join("\n");
}

export async function runFounderAnimation(options = {}) {
  const {
    color = supportsColor(options.stdout),
    frames = PHASES.length * 2,
    intervalMs = 90,
    stdout = process.stdout
  } = options;

  stdout.write(ANSI.hideCursor);

  try {
    let previousLineCount = 0;

    for (let index = 0; index < frames; index += 1) {
      if (previousLineCount > 0) {
        stdout.write(`\x1b[${previousLineCount}A`);
      }

      const frame = renderFounderFrame(index, { color });
      previousLineCount = frame.split("\n").length;

      stdout.write(frame);
      stdout.write("\n");
      await sleep(intervalMs);
    }
  } finally {
    stdout.write(ANSI.showCursor);
  }
}
