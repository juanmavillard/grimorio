import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.env.GRIMORIO_PDF_PYTHON || "python3",
  ["scripts/clean-generated.py"],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status || (result.signal ? 1 : 0);
