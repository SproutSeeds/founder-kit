import assert from "node:assert/strict";
import test from "node:test";

import { MASCOT_NAME, renderFounderFrame, shouldAnimate } from "../src/animation.js";
import { buildDailyBrief, formatDailyBrief } from "../src/founder-day.js";
import { parseArgs } from "../src/cli.js";

test("parseArgs handles the main CLI flags", () => {
  assert.deepEqual(parseArgs(["--json", "--no-animation"]), {
    animation: false,
    demo: false,
    help: false,
    json: true,
    version: false
  });
});

test("parseArgs rejects unknown flags", () => {
  assert.throws(() => parseArgs(["--wat"]), /unknown option --wat/);
});

test("renderFounderFrame includes the phase engine", () => {
  const frame = renderFounderFrame(1);

  assert.match(frame, /founder-kit/);
  assert.match(frame, /agent-first founder loop/);
  assert.match(frame, new RegExp(MASCOT_NAME));
  assert.match(frame, /write the brief/);
  assert.match(frame, /task made agent-readable/);
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

  assert.match(output, /Friday agent-first founder loop/);
  assert.match(output, /Signal:/);
  assert.match(output, /Agent:/);
  assert.match(output, /Cadence:/);
});
