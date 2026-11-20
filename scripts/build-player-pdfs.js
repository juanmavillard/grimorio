import { spawnSync } from "node:child_process";
const run = (binary, args) => {
  const result = spawnSync(binary, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};
run(process.execPath, ["scripts/export-player-sheets.js"]);
run(process.env.GRIMORIO_PDF_PYTHON || "python3", [
  "scripts/generate-player-pdfs.py",
]);
