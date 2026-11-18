// Testes E2E do Atalhos Arcanjo v3 (Redesign "Clínica Serena"):
// Valida as 5 áreas, Dados do Paciente + Calculadoras ao vivo + Pré-preenchimento automático,
// Favoritos, Biblioteca, Editor lado a lado, Assinatura Médica, Paleta Ctrl+K, Tema Claro/Escuro e Automação {key: tab}.
import puppeteer from "puppeteer-core";
import http from "node:http";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { execSync } from "node:child_process";

const CHROME_PATHS = [
  process.env.CFT,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter((p) => p && existsSync(p));

const executablePath = CHROME_PATHS[0];
if (!executablePath) {
  console.error("Nenhum executável Chrome/Edge encontrado.");
  process.exit(1);
}

const ARTIFACT_DIR = "C:\\Users\\1\\.gemini\\antigravity\\brain\\929bd856-c19c-4ded-9f4a-7ff395e0a558";

// 1. Gera ícones na paleta "Clínica Serena" (#1F6F78)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="6" y="6" width="116" height="116" rx="28" fill="#1F6F78"/>
  <rect x="26" y="38" width="46" height="10" rx="5" fill="#FFFFFF"/>
  <rect x="26" y="60" width="74" height="10" rx="5" fill="#FFFFFF" opacity=".9"/>
  <rect x="26" y="82" width="54" height="10" rx="5" fill="#FFFFFF" opacity=".75"/>
  <rect x="88" y="22" width="8" height="24" rx="3.5" fill="#E6F1F2"/>
  <rect x="80" y="30" width="24" height="8" rx="3.5" fill="#E6F1F2"/>
</svg>`;

mkdirSync("src/icons", { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

const iconPage = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  await iconPage.setViewport({ width: size, height: size });
  await iconPage.setContent(`<html><body style="margin:0;background:transparent">${iconSvg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
  await iconPage.screenshot({ path: `src/icons/${size}.png`, omitBackground: true });
}
await iconPage.close();
console.log("✔ Ícones 'Clínica Serena' gerados em src/icons/");

// Recompila dist/chrome, dist/firefox e pacotes .zip
execSync("node build.mjs", { stdio: "inherit" });

const mime = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
};
const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];
  if (urlPath === "/test-page.html") {
    res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    return res.end(readFileSync("test/page.html"));
  }
  const filePath = join("dist/chrome", urlPath === "/" ? "options.html" : urlPath);
  if (!existsSync(filePath)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": mime[extname(filePath)] || "text/plain" });
  res.end(readFileSync(filePath));
}).listen(0);

const baseUrl = `http://localhost:${server.address().port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failed = 0, ticks = 0;
const check = (name, got, want) => {
  ticks++;
  const ok = typeof want === "function" ? want(got) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${String(ticks).padStart(2)}. ${ok ? "✔" : "✘ FALHOU"} ${name}${ok ? "" : `\n     obtido:   ${JSON.stringify(got)}\n     esperado: ${typeof want === "function" ? want.toString() : JSON.stringify(want)}`}`);
};

const testBucketKey = `arcanjo-e2e-test-${Date.now()}`;
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 920 });
await page.evaluateOnNewDocument((k) => {
  if (!localStorage.getItem("aa_settings")) {
    localStorage.setItem("aa_settings", JSON.stringify({ cloudKey: k }));
  }
}, testBucketKey);
await page.goto(`${baseUrl}/options.html`, { waitUntil: "networkidle0" });
await sleep(350);

// Força tema claro primeiro para testar e fotografar a paleta Clínica Serena clara
await page.click("#themeToggle");
const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
if (initialTheme === "dark") await page.click("#themeToggle");
await sleep(150);

// 1. Verifica tela inicial "Consulta" e Favoritos carregados
const activeTitle = await page.$eval("#viewTitle", (el) => el.textContent);
const favChipCount = await page.$$eval("#favBar .q-chip", (els) => els.length);
check("Tela inicial Consulta abre com barra de Favoritos populada", [activeTitle, favChipCount >= 8], ["Consulta", true]);

// 2. Preenche os Dados do Paciente e verifica Calculadoras Automáticas ao Vivo
await page.type('[data-pt="nome"]', "Maria Clara Andrade");
await page.type('[data-pt="idade"]', "72");
await page.select('[data-pt="sexo"]', "Feminino");
await page.type('[data-pt="peso"]', "68");
await page.type('[data-pt="altura"]', "1.60");
await page.type('[data-pt="creatinina"]', "1.1");
await page.type('[data-pt="ast"]', "34");
await page.type('[data-pt="alt"]', "38");
await page.type('[data-pt="plaquetas"]', "205");
await sleep(250);

const liveCalcs = await page.evaluate(() => ({
  imc: document.querySelector("#calc-imc .v").textContent,
  imcSub: document.querySelector("#calc-imc .s").textContent,
  clcr: document.querySelector("#calc-clcr .v").textContent,
  fib4: document.querySelector("#calc-fib4 .v").textContent,
}));
check("Calculadoras ao vivo no painel do paciente (IMC Idoso, ClCr e FIB-4)", liveCalcs, {
  imc: "26.6 kg/m²",
  imcSub: "Eutrofia para idoso (22 a 27 kg/m²)",
  clcr: "49.6 mL/min",
  fib4: "1.94",
});

// 3. Dispara /clcr pela barra de Favoritos: modal deve abrir já com Idade=72, Peso=68, Creatinina=1.1, Sexo=Feminino!
await page.evaluate(() => {
  const chip = [...document.querySelectorAll("#favBar .q-chip")].find((b) => b.textContent.includes("/clcr"));
  if (chip) chip.click();
});
await sleep(350);
const modalOpen = await page.evaluate(() => !!document.querySelector("typefill-box"));
check("Modal interativo abre ao clicar no favorito /clcr", modalOpen, true);

await page.screenshot({ path: join(ARTIFACT_DIR, "v3-modal-paciente.png"), fullPage: false });
console.log("✔ Screenshot salvo: v3-modal-paciente.png");

await page.keyboard.press("Enter");
await sleep(300);
const docClcr = await page.$eval("#tryBox", (el) => el.value);
check("Pré-preenchimento automático pelos Dados do Paciente funciona no /clcr", docClcr, (t) => t.includes("Idade: 72 anos") && t.includes("Peso: 68 kg") && t.includes("49.6 mL/min"));

await page.screenshot({ path: join(ARTIFACT_DIR, "v3-consulta-claro.png"), fullPage: false });
console.log("✔ Screenshot salvo: v3-consulta-claro.png");

// 4. Testa Configuração de Assinatura Médica e uso em /atestado
await page.click('.nav-item[data-nav="config"]');
await sleep(200);
await page.type("#sigNome", "Dr. Arcanjo");
await page.type("#sigCrm", "123456/SP");
await page.type("#sigRqe", "78910");
await page.click("#saveSig");
await sleep(250);

// Volta para Consulta, limpa o documento e insere /atestado via Paleta de Comandos (Ctrl+K)
await page.click("#cmdkOpen");
await sleep(200);
await page.type("#cmdkInput", "/atestado");
await sleep(150);
await page.keyboard.press("Enter");
await sleep(350);
// O modal do /atestado já vem com "Maria Clara Andrade" pré-preenchido! Pressiona Enter para inserir:
await page.keyboard.press("Enter");
await sleep(300);
const docAtestado = await page.$eval("#tryBox", (el) => el.value);
check("Paleta Ctrl+K + Nome do Paciente + Assinatura configurada funcionam em /atestado", docAtestado, (t) => t.includes("Maria Clara Andrade") && t.includes("Dr. Arcanjo") && t.includes("CRM: 123456/SP | RQE: 78910"));

// 5. Testa Biblioteca e Editor lado a lado
await page.click('.nav-item[data-nav="biblioteca"]');
await sleep(250);
await page.screenshot({ path: join(ARTIFACT_DIR, "v3-biblioteca.png"), fullPage: false });
console.log("✔ Screenshot salvo: v3-biblioteca.png");

await page.evaluate(() => {
  const row = [...document.querySelectorAll(".snip-row")].find((r) => r.textContent.includes("/hpylori"));
  if (row) row.click();
});
await sleep(250);
const editorVisible = await page.$eval('[data-view="editor"]', (el) => !el.hidden);
check("Clicar em um atalho na Biblioteca abre o Editor lado a lado", editorVisible, true);
await page.screenshot({ path: join(ARTIFACT_DIR, "v3-editor.png"), fullPage: false });
console.log("✔ Screenshot salvo: v3-editor.png");

// 6. Testa Modo Escuro na tela Consulta
await page.click('.nav-item[data-nav="consulta"]');
await page.click("#themeToggle");
await sleep(200);
const isDarkNow = await page.evaluate(() => document.documentElement.dataset.theme === "dark");
check("Alternância para Modo Escuro funciona", isDarkNow, true);
await page.screenshot({ path: join(ARTIFACT_DIR, "v3-consulta-escuro.png"), fullPage: false });
console.log("✔ Screenshot salvo: v3-consulta-escuro.png");

// 7. Testa automação {key: tab} na página externa
await page.goto(`${baseUrl}/test-page.html`, { waitUntil: "networkidle0" });
await sleep(300);
await page.click("#f1");
await page.keyboard.type("/preencher-form");
await sleep(350);
await page.keyboard.press("Enter");
await sleep(400);
const [f1Val, f2Val] = await page.evaluate(() => [document.getElementById("f1").value, document.getElementById("f2").value]);
check("Automação {key: tab} preenche múltiplos campos automaticamente", [f1Val, f2Val], ["Consulta Clínica", "Gastroenterologia / Geriatria"]);

// 8. Testa Sincronização em Nuvem entre Computador 1 e Computador 2
await page.goto(`${baseUrl}/options.html#config`, { waitUntil: "networkidle0" });
await sleep(250);
await page.click("#cloudSyncNow");
await sleep(1200);

// Simula Computador 2 (contexto anônimo limpo) abrindo o site da Vercel
const context2 = await browser.createBrowserContext();
const pc2 = await context2.newPage();
await pc2.evaluateOnNewDocument((k) => {
  localStorage.setItem("aa_settings", JSON.stringify({ cloudKey: k }));
}, testBucketKey);
await pc2.goto(`${baseUrl}/options.html`, { waitUntil: "networkidle0" });
await sleep(1400);
const pc2Sig = await pc2.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("aa_snippets") || "[]").find((x) => x.shortcut === "/assinatura");
  return s?.text ?? "";
});
check("Sincronização em Nuvem: Computador 2 recebe automaticamente os dados salvos no Computador 1", pc2Sig.includes("Dr. Arcanjo") && pc2Sig.includes("123456/SP"), true);
await context2.close();

await browser.close();
server.close();
console.log(failed ? `\n✘ ${failed} teste(s) E2E falharam` : `\n✔ Todos os ${ticks} testes E2E do novo design passaram com sucesso!`);
process.exit(failed ? 1 : 0);
