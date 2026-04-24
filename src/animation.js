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
export const MASCOT_NAME = "Scout-01";

const BOOT_FRAMES = [
  {
    prompt: "resolve the place",
    output: "state county city"
  },
  {
    prompt: "check the rules",
    output: "license zoning tax"
  },
  {
    prompt: "save the proof",
    output: "official source captured"
  },
  {
    prompt: "track renewals",
    output: "calendar stays warm"
  },
  {
    prompt: "buy clean",
    output: "diligence before closing"
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

  return [
    colorize("founder-kit", "bold", color),
    colorize("agent-first compliance scout", "dim", color),
    `${colorize(MASCOT_NAME, "cyan", color)}: ${frame.prompt}`,
    colorize(frame.output, "green", color),
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
