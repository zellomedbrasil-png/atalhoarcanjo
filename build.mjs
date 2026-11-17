// Compila a extensão Atalhos Arcanjo em dist/chrome (Chrome, Edge, Brave, Opera) e dist/firefox a partir de src/,
// e gera pacotes .zip prontos para download na raiz e no servidor web local.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const base = JSON.parse(readFileSync("manifest.base.json", "utf8"));

const targets = {
  chrome: {
    ...base,
    background: { service_worker: "background.js" },
    permissions: [...base.permissions, "scripting"],
    content_scripts: base.content_scripts.map((c) => ({ ...c, match_origin_as_fallback: true })),
  },
  firefox: {
    ...base,
    background: { scripts: ["medical-starters.js", "background.js"] },
    browser_specific_settings: { gecko: { id: "atalhosarcanjo@medico.local", strict_min_version: "128.0" } },
  },
};

for (const [name, manifest] of Object.entries(targets)) {
  const out = `dist/${name}`;
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync("src", out, { recursive: true });
  writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Compilado com sucesso: ${out}`);
}

// Gera os arquivos .zip na raiz do projeto para facilitar o download
try {
  execSync('powershell -NoProfile -Command "Compress-Archive -Path \'dist/chrome/*\' -DestinationPath \'Atalhos-Arcanjo-Chrome-Edge.zip\' -Force"', { stdio: "ignore" });
  execSync('powershell -NoProfile -Command "Compress-Archive -Path \'dist/firefox/*\' -DestinationPath \'Atalhos-Arcanjo-Firefox.zip\' -Force"', { stdio: "ignore" });
  cpSync("Atalhos-Arcanjo-Chrome-Edge.zip", "dist/chrome/Atalhos-Arcanjo-Chrome-Edge.zip");
  cpSync("Atalhos-Arcanjo-Firefox.zip", "dist/chrome/Atalhos-Arcanjo-Firefox.zip");
  console.log("Pacotes ZIP gerados: Atalhos-Arcanjo-Chrome-Edge.zip e Atalhos-Arcanjo-Firefox.zip");
} catch {
  // Em sistemas não-Windows sem PowerShell, mantém dist/chrome e dist/firefox
}
