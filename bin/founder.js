#!/usr/bin/env node

import { runFounderKitCli } from "../src/cli.js";

runFounderKitCli(process.argv.slice(2), {
  env: process.env,
  stderr: process.stderr,
  stdin: process.stdin,
  stdout: process.stdout
}).catch((error) => {
  process.stderr.write(`founder-kit: ${error.message}\n`);
  process.exitCode = 1;
});
