// Compila a extensão Atalhos Arcanjo em dist/chrome (Chrome, Edge, Brave, Opera) e dist/firefox a partir de src/,
// gera index.html para hospedagem web (Vercel / Netlify) e pacotes .zip prontos para download.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  // Cria também index.html espelhando options.html para funcionar direto na raiz na Vercel
  cpSync("src/options.html", `${out}/index.html`);
  writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Compilado com sucesso: ${out}`);
}

// Atualiza os arquivos .zip quando PowerShell estiver disponível (Windows)
try {
  execSync('powershell -NoProfile -Command "Compress-Archive -Path \'dist/chrome/*\' -DestinationPath \'Atalhos-Arcanjo-Chrome-Edge.zip\' -Force"', { stdio: "ignore" });
  execSync('powershell -NoProfile -Command "Compress-Archive -Path \'dist/firefox/*\' -DestinationPath \'Atalhos-Arcanjo-Firefox.zip\' -Force"', { stdio: "ignore" });
  console.log("Pacotes ZIP atualizados: Atalhos-Arcanjo-Chrome-Edge.zip e Atalhos-Arcanjo-Firefox.zip");
} catch {
  // Em servidores Linux (como Vercel), utiliza os pacotes .zip versionados na raiz
}

// Copia os pacotes .zip para dentro de dist/chrome para que os links de download funcionem na Vercel
if (existsSync("Atalhos-Arcanjo-Chrome-Edge.zip")) {
  cpSync("Atalhos-Arcanjo-Chrome-Edge.zip", "dist/chrome/Atalhos-Arcanjo-Chrome-Edge.zip");
}
if (existsSync("Atalhos-Arcanjo-Firefox.zip")) {
  cpSync("Atalhos-Arcanjo-Firefox.zip", "dist/chrome/Atalhos-Arcanjo-Firefox.zip");
}
