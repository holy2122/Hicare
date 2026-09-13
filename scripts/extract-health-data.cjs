const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const source = path.join(projectRoot, "client/src/data/healthData.ts");
const tempOutput = path.join(__dirname, ".healthData.bundle.cjs");
const target = path.join(projectRoot, "client/public/healthData.json");

execFileSync("pnpm", ["exec", "esbuild", source, "--bundle", "--platform=node", "--format=cjs", `--outfile=${tempOutput}`], {
  cwd: projectRoot,
  stdio: "inherit",
});

const mod = require(tempOutput);
if (!Array.isArray(mod.HEALTH_CONDITIONS) || mod.HEALTH_CONDITIONS.length !== 8) {
  throw new Error("Expected exactly 8 health conditions in the source dataset.");
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(mod.HEALTH_CONDITIONS, null, 2)}\n`, "utf8");
fs.rmSync(tempOutput, { force: true });
console.log(`Extracted ${mod.HEALTH_CONDITIONS.length} conditions to ${target}`);
