import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { MASCOT_NAME, renderFounderFrame, shouldAnimate } from "../src/animation.js";
import { buildComplianceChecklist, createFounderProfile } from "../src/compliance.js";
import { buildDailyBrief, formatDailyBrief } from "../src/founder-day.js";
import { parseArgs, runFounderKitCli } from "../src/cli.js";

test("parseArgs handles the main CLI flags", () => {
  assert.deepEqual(parseArgs(["--json", "--no-animation"]), {
    animation: false,
    command: "daily",
    commandArgs: [],
    demo: false,
    help: false,
    json: true,
    positionals: [],
    values: {},
    version: false
  });
});

test("parseArgs rejects unknown flags", () => {
  assert.throws(() => parseArgs(["--wat"]), /unknown option --wat/);
});

test("parseArgs captures compliance commands and options", () => {
  assert.deepEqual(parseArgs(["init", "--name", "Pebble Ops", "--state=FL", "--home-based"]), {
    animation: true,
    command: "init",
    commandArgs: [],
    demo: false,
    help: false,
    json: false,
    positionals: [],
    values: {
      "home-based": true,
      name: "Pebble Ops",
      state: "FL"
    },
    version: false
  });
});

test("parseArgs rejects unknown commands", () => {
  assert.throws(() => parseArgs(["wat"]), /unknown command wat/);
});

test("renderFounderFrame includes the phase engine", () => {
  const frame = renderFounderFrame(1);

  assert.match(frame, /founder-kit/);
  assert.match(frame, /agent-first compliance scout/);
  assert.match(frame, new RegExp(MASCOT_NAME));
  assert.match(frame, /check the rules/);
  assert.match(frame, /license zoning tax/);
  assert.match(frame, /\[signal\]--\[BRIEF\]--\[agent\]--\[ship\]--\[cadence\]/);
});

test("shouldAnimate stays quiet for non-TTY streams unless forced", () => {
  const stream = { isTTY: false };

  assert.equal(shouldAnimate(stream, {}, false), false);
  assert.equal(shouldAnimate(stream, {}, true), true);
});

test("formatDailyBrief produces the founder loop", () => {
  const brief = buildDailyBrief(new Date("2026-04-24T12:00:00Z"));
  const output = formatDailyBrief(brief);

  assert.match(output, /Friday agent-first compliance loop/);
  assert.match(output, /Profile:/);
  assert.match(output, /Scout:/);
  assert.match(output, /Cadence:/);
});

test("buildComplianceChecklist creates local licensing and zoning tasks", () => {
  const profile = createFounderProfile({
    activity: "home-based AI bookkeeping",
    city: "Orlando",
    county: "Orange",
    entity: "LLC",
    "formation-state": "FL",
    "home-based": true,
    "inside-city-limits": true,
    name: "Pebble Ops LLC",
    state: "FL"
  });
  const result = buildComplianceChecklist(profile, { now: new Date("2026-04-24T12:00:00Z") });

  assert.equal(result.generatedAt, "2026-04-24");
  assert.match(result.checklist.map((entry) => entry.title).join("\n"), /county business tax receipt/);
  assert.match(result.checklist.map((entry) => entry.title).join("\n"), /Verify allowed use/);
  assert.match(result.checklist.map((entry) => entry.id).join("\n"), /home-occupation/);
});

test("runFounderKitCli persists profile and evidence", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "founder-kit-test-"));
  let stdout = "";
  const io = {
    cwd,
    env: {},
    stderr: { write() {} },
    stdout: {
      isTTY: false,
      write(value) {
        stdout += value;
      }
    }
  };

  try {
    await runFounderKitCli([
      "init",
      "--name",
      "Pebble Ops LLC",
      "--entity",
      "LLC",
      "--formation-state",
      "FL",
      "--state",
      "FL",
      "--county",
      "Orange",
      "--city",
      "Orlando",
      "--address-type",
      "home",
      "--activity",
      "AI bookkeeping",
      "--inside-city-limits",
      "true",
      "--home-based"
    ], io);

    const statePath = join(cwd, ".founder-kit", "founder.json");
    const state = JSON.parse(await readFile(statePath, "utf8"));
    assert.equal(state.business.name, "Pebble Ops LLC");
    assert.equal(state.location.homeBased, true);

    stdout = "";
    await runFounderKitCli(["binder", "add", "--label", "County BTR page", "--url", "https://example.gov/btr", "--renewal-date", "2026-09-30"], io);
    assert.match(stdout, /Evidence added/);

    const updated = JSON.parse(await readFile(statePath, "utf8"));
    assert.equal(updated.evidence[0].label, "County BTR page");

    stdout = "";
    await runFounderKitCli(["scout"], io);
    assert.match(stdout, /Founder Kit compliance scout/);
    assert.match(stdout, /business tax receipt/);
  } finally {
    await rm(cwd, { force: true, recursive: true });
  }
});
