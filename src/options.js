// Atalhos Arcanjo v3 — Controlador Principal (Consulta, Biblioteca, Editor, Configurações, Instalar e Paleta Ctrl+K)

const rawApi = globalThis.browser ?? globalThis.chrome;
const storageLocal = rawApi?.storage?.local ?? {
  async get(keys) {
    const list = Array.isArray(keys) ? keys : typeof keys === "string" ? [keys] : Object.keys(keys ?? {});
    const out = {};
    for (const k of list) {
      try {
        const raw = localStorage.getItem(`aa_${k}`);
        if (raw != null) out[k] = JSON.parse(raw);
      } catch { /* ignore */ }
    }
    return out;
  },
  async set(items) {
    for (const [k, v] of Object.entries(items)) {
      try { localStorage.setItem(`aa_${k}`, JSON.stringify(v)); } catch { /* ignore */ }
    }
    window.dispatchEvent(new CustomEvent("aa-storage-changed", { detail: items }));
  },
  async remove(key) {
    try { localStorage.removeItem(`aa_${key}`); } catch { /* ignore */ }
  }
};

const T = globalThis.TFTemplate;
const H = globalThis.TFHtml;
const STARTERS = globalThis.MEDICAL_STARTERS ?? [];
const $ = (id) => document.getElementById(id);

const DEFAULT_FAVS = new Set([
  "/soap", "/ef", "/gastro", "/drge", "/hpylori", "/sii", "/fib4", "/aga", "/clcr", "/receita", "/atestado"
]);

const VIEW_TITLES = {
  consulta: "Consulta",
  biblioteca: "Biblioteca de Atalhos",
  editor: "Editor de Atalho",
  config: "Configurações e Assinatura",
  instalar: "Instalar Extensão no Navegador",
};

const DEFAULT_CLOUD_KEY = "arcanjo-zellomed-8f92a1c4-7b3d-4e5f";
const CLOUD_ENDPOINT = "https://textdb.dev/api/data/";

let snippets = [];
let uses = {};
let settings = {};
let patientContext = {};
let current = null;
let selectedFolder = "";
let activeView = "consulta";
let cloudTimer = 0;
let cloudBusy = false;

// Expõe dados do paciente para o content.js na mesma página
globalThis.__arcanjoPatient = () => patientContext;

function toast(msg) {
  const box = $("toasts");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  box.append(el);
  setTimeout(() => el.remove(), 3200);
}

// ---- Tema Claro / Escuro / Automático ----
function applyTheme(pref = settings.theme || "auto") {
  const dark = pref === "dark" || (pref === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const sel = $("themeSelect");
  if (sel && sel.value !== pref) sel.value = pref;
  const useEl = $("themeToggle")?.querySelector("use");
  if (useEl) useEl.setAttribute("href", dark ? "#i-sun" : "#i-moon");
}

window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
  if ((settings.theme || "auto") === "auto") applyTheme("auto");
});

// ---- Navegação entre Telas (Hash Router) ----
function isBlankGhost(s) {
  if (!s) return true;
  const sc = (s.shortcut ?? "").trim();
  const lb = (s.label ?? "").trim();
  const tx = (s.rich ? H.toText(s.html ?? "") : (s.text ?? "")).trim();
  return (!sc || sc === "/") && !lb && !tx;
}

function setView(viewName, snippetId = null) {
  const valid = VIEW_TITLES[viewName] ? viewName : "consulta";
  // Se estava no editor de um rascunho totalmente em branco e saiu sem preencher, remove o rascunho vazio
  if (activeView === "editor" && valid !== "editor") {
    const beforeLen = snippets.length;
    snippets = snippets.filter((s) => !isBlankGhost(s));
    if (snippets.length !== beforeLen) {
      if (!snippets.some((s) => s.id === current)) current = sorted()[0]?.id ?? null;
      void save();
      drawQuickBars();
      drawList();
    }
  }
  activeView = valid;
  if (snippetId) pick(snippetId, false);
  for (const sec of document.querySelectorAll(".view[data-view]")) {
    sec.hidden = sec.dataset.view !== valid;
  }
  for (const link of document.querySelectorAll(".nav-item[data-nav]")) {
    link.classList.toggle("active", link.dataset.nav === valid);
  }
  $("viewTitle").textContent = VIEW_TITLES[valid];
  const targetHash = valid === "editor" && current ? `#editor/${current}` : `#${valid}`;
  if (location.hash !== targetHash) {
    history.replaceState(null, "", targetHash);
  }
}

function handleHash() {
  const raw = location.hash.replace(/^#/, "").trim();
  if (!raw) { setView("consulta"); return; }
  const [v, id] = raw.split("/");
  if (v === "editor" && id && snippets.some((s) => s.id === id)) {
    setView("editor", id);
  } else if (VIEW_TITLES[v]) {
    setView(v);
  } else {
    setView("consulta");
  }
}
window.addEventListener("hashchange", handleHash);

// ---- Inicialização ----
async function start() {
  const data = await storageLocal.get([
    "snippets", "uses", "settings", "syncState", "clinicalPadDraft", "patientContext", "tipHidden", "deleted"
  ]);
  const rawSnippets = data.snippets ?? [];
  const localDel = data.deleted ?? {};
  // Remove quaisquer rascunhos em branco ("Sem título" / "(sem código)") e registra na lista de excluídos
  let ghostCleaned = false;
  for (const s of rawSnippets) {
    if (isBlankGhost(s) && s?.id) {
      localDel[s.id] = Date.now();
      if (s.shortcut) localDel[`sc:${s.shortcut.trim().toLowerCase()}`] = Date.now();
      ghostCleaned = true;
    }
  }
  snippets = rawSnippets.filter((s) => !isBlankGhost(s));
  if (ghostCleaned) {
    await storageLocal.set({ snippets, deleted: localDel });
  }
  if (!snippets.length && STARTERS.length) {
    // Atalhos padrão recebem carimbo base (1000) para que qualquer edição na nuvem tenha prioridade ao sincronizar em um novo PC
    snippets = STARTERS.map((s, i) => ({
      id: `starter_${(s.shortcut || String(i)).replace(/[^a-z0-9]/gi, "")}`,
      ...s,
      fav: DEFAULT_FAVS.has(s.shortcut),
      folder: s.folder || "01. Clínica Médica & Alto Fluxo",
      created: 1000,
      edited: 1000,
    }));
    await storageLocal.set({ snippets });
  } else if (snippets.length && !snippets.some((s) => s.fav !== undefined)) {
    for (const s of snippets) {
      if (DEFAULT_FAVS.has(s.shortcut)) s.fav = true;
    }
    await storageLocal.set({ snippets });
  }

  uses = data.uses ?? {};
  settings = data.settings ?? {};
  patientContext = data.patientContext ?? {};

  applyTheme(settings.theme || "auto");
  $("enabled").checked = settings.enabled !== false;
  $("syncOn").checked = settings.sync !== false;
  if ($("cloudSyncOn")) $("cloudSyncOn").checked = settings.cloudSync !== false;
  if ($("cloudKey")) $("cloudKey").value = settings.cloudKey || DEFAULT_CLOUD_KEY;
  $("patientEverywhere").checked = !!settings.patientEverywhere;
  $("blocked").value = (settings.blockedSites ?? []).join(", ");

  const tipHidden = !!data.tipHidden;
  $("tipCard").hidden = tipHidden;
  $("tipShow").checked = !tipHidden;

  if (data.clinicalPadDraft) $("tryBox").value = data.clinicalPadDraft;
  updateCharCount();

  // Preenche campos do paciente salvos
  for (const el of document.querySelectorAll("[data-pt]")) {
    const key = el.dataset.pt;
    if (patientContext[key] !== undefined) el.value = patientContext[key];
  }
  updatePatientCalcs();

  // Preenche formulário de assinatura médica
  loadSignatureForm();

  // Verifica se está rodando como extensão instalada
  if (rawApi?.runtime?.id) {
    $("installedNote").hidden = false;
  }

  showSync(data.syncState);
  drawQuickBars();
  drawList();
  const first = sorted()[0];
  if (first) pick(first.id, false);
  handleHash();
  // Sincroniza automaticamente com a nuvem ao abrir em qualquer computador
  void cloudPull(true);
}

window.addEventListener("focus", () => { void cloudPull(false); });

function stampOf(s) {
  return s?.edited ?? s?.created ?? 0;
}

function mergeWithCloud(localList, localDel, remoteList, remoteDel) {
  const deleted = { ...(localDel ?? {}) };
  for (const [k, at] of Object.entries(remoteDel ?? {})) {
    deleted[k] = Math.max(deleted[k] ?? 0, at);
  }
  const byKey = new Map();
  const keyFor = (s) => (s.shortcut ? `sc:${s.shortcut.trim().toLowerCase()}` : `id:${s.id}`);
  for (const s of [...(localList ?? []), ...(remoteList ?? [])]) {
    if (!s || isBlankGhost(s)) continue;
    const k = keyFor(s);
    const prev = byKey.get(k);
    if (!prev || stampOf(s) > stampOf(prev)) {
      byKey.set(k, s);
    }
  }
  const merged = [];
  for (const s of byKey.values()) {
    const delAt = Math.max(deleted[s.id] ?? 0, s.shortcut ? (deleted[`sc:${s.shortcut.trim().toLowerCase()}`] ?? 0) : 0);
    if (delAt >= stampOf(s)) continue;
    merged.push(s);
  }
  return { snippets: merged, deleted };
}

function activeCloudKey() {
  return (settings.cloudKey || $("cloudKey")?.value || DEFAULT_CLOUD_KEY).trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

async function cloudPull(pushIfEmpty = false) {
  if (settings.cloudSync === false || cloudBusy) return false;
  const key = activeCloudKey();
  if (!key) return false;
  cloudBusy = true;
  try {
    const res = await fetch(`${CLOUD_ENDPOINT}${key}`, { cache: "no-store" });
    if (!res.ok) return false;
    const raw = (await res.text()).trim();
    if (!raw) {
      if (pushIfEmpty) { cloudBusy = false; await cloudPush(); }
      return false;
    }
    let remote;
    try { remote = JSON.parse(raw); } catch { return false; }
    if (!Array.isArray(remote?.snippets)) return false;

    const { deleted: localDel = {} } = await storageLocal.get("deleted");
    const merged = mergeWithCloud(snippets, localDel, remote.snippets, remote.deleted);
    snippets = merged.snippets;

    if (remote.signature && (remote.signatureUpdatedAt ?? 0) > (settings.signatureUpdatedAt ?? 0)) {
      settings = { ...settings, signature: remote.signature, signatureUpdatedAt: remote.signatureUpdatedAt };
      loadSignatureForm();
    }

    saving = true;
    try {
      await storageLocal.set({ snippets, deleted: merged.deleted, settings });
    } finally {
      saving = false;
    }
    drawQuickBars();
    drawList();
    if (current && snippets.some((s) => s.id === current)) {
      pick(current, false);
    } else if (snippets.length) {
      pick(sorted()[0].id, false);
    }
    $("syncState").classList.remove("bad");
    $("syncState").textContent = "☁️ Sincronizado na nuvem (todos os PCs)";
    return true;
  } catch {
    return false;
  } finally {
    cloudBusy = false;
  }
}

async function cloudPush() {
  if (settings.cloudSync === false) return false;
  const key = activeCloudKey();
  if (!key) return false;
  try {
    // Primeiro mescla caso outro computador tenha salvo algo recentemente
    await cloudPull(false);
    cloudBusy = true;
    const { deleted = {} } = await storageLocal.get("deleted");
    const payload = {
      app: "atalhos-arcanjo",
      at: Date.now(),
      snippets,
      deleted,
      signature: settings.signature ?? null,
      signatureUpdatedAt: settings.signatureUpdatedAt ?? 0,
    };
    const res = await fetch(`${CLOUD_ENDPOINT}${key}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      $("syncState").classList.remove("bad");
      $("syncState").textContent = "☁️ Salvo na nuvem (todos os PCs)";
      return true;
    }
  } catch { /* offline ou sem rede no momento */ }
  finally {
    cloudBusy = false;
  }
  return false;
}

function scheduleCloudPush() {
  if (settings.cloudSync === false) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => { void cloudPush(); }, 900);
}

if (rawApi?.storage?.onChanged) {
  rawApi.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.uses) { uses = changes.uses.newValue ?? {}; drawQuickBars(); drawList(); }
    if (changes.syncState) showSync(changes.syncState.newValue);
    if (changes.snippets && !saving) {
      snippets = changes.snippets.newValue ?? [];
      drawQuickBars();
      drawList();
      if (!snippets.some((s) => s.id === current)) pick(sorted()[0]?.id ?? null, false);
    }
  });
}

function showSync(state) {
  const el = $("syncState");
  el.classList.toggle("bad", !!state && !state.ok && !state.off);
  if (!state || state.off) {
    el.textContent = settings.sync === false ? "Local (sinc. desligada)" : "100% Local & Privado";
    return;
  }
  if (state.tooBig) {
    el.textContent = `Acima do limite de nuvem (${Math.round(state.size / 1000)} KB)`;
    return;
  }
  if (state.error) { el.textContent = `Sincronização pausada`; return; }
  el.textContent = `Sincronizado · ${Math.round((state.size ?? 0) / 1000)} KB`;
}

// ---- Painel Dados do Paciente e Calculadoras ao Vivo ----
function setCalcRow(id, ready, valText, subText) {
  const row = $(id);
  if (!row) return;
  row.classList.toggle("ready", !!ready);
  row.querySelector(".v").textContent = ready ? valText : "—";
  row.querySelector(".s").textContent = ready ? subText : "Preencha os campos acima";
}

function updatePatientCalcs() {
  const p = patientContext;
  const hasImc = !!(p.peso && p.altura);
  if (hasImc) {
    const v = T.evalExpr("imc(peso, altura)", { peso: p.peso, altura: p.altura });
    const cl = T.evalExpr("classImc(peso, altura, idade)", { peso: p.peso, altura: p.altura, idade: p.idade || 40 });
    setCalcRow("calc-imc", v && v !== "0.0", `${v} kg/m²`, cl);
  } else {
    setCalcRow("calc-imc", false, "—", "");
  }

  const hasClcr = !!(p.idade && p.peso && p.creatinina);
  if (hasClcr) {
    const sexo = p.sexo || "Masculino";
    const v = T.evalExpr("cockcroft(idade, peso, cr, sexo)", { idade: p.idade, peso: p.peso, cr: p.creatinina, sexo });
    const st = T.evalExpr("estagioDrc(v)", { v });
    setCalcRow("calc-clcr", v && v !== "0.0", `${v} mL/min`, st);
  } else {
    setCalcRow("calc-clcr", false, "—", "");
  }

  const hasFib4 = !!(p.idade && p.ast && p.alt && p.plaquetas);
  if (hasFib4) {
    const v = T.evalExpr("fib4(idade, ast, alt, plq)", { idade: p.idade, ast: p.ast, alt: p.alt, plq: p.plaquetas });
    const rk = T.evalExpr("riscoFib4(idade, ast, alt, plq)", { idade: p.idade, ast: p.ast, alt: p.alt, plq: p.plaquetas });
    setCalcRow("calc-fib4", v && v !== "0.00", v, rk);
  } else {
    setCalcRow("calc-fib4", false, "—", "");
  }

  const hasMeld = !!(p.bilirrubina && p.inr && p.creatinina);
  if (hasMeld) {
    const v = T.evalExpr("meld(bili, inr, cr, na)", {
      bili: p.bilirrubina, inr: p.inr, cr: p.creatinina, na: p.sodio || 137
    });
    setCalcRow("calc-meld", !!v, `${v} pts`, `Sódio: ${p.sodio || 137} mEq/L`);
  } else {
    setCalcRow("calc-meld", false, "—", "");
  }
}

for (const el of document.querySelectorAll("[data-pt]")) {
  const onPtChange = () => {
    patientContext[el.dataset.pt] = el.value.trim();
    updatePatientCalcs();
    storageLocal.set({ patientContext });
  };
  el.addEventListener("input", onPtChange);
  el.addEventListener("change", onPtChange);
}

$("newConsult").addEventListener("click", () => {
  patientContext = {};
  for (const el of document.querySelectorAll("[data-pt]")) el.value = "";
  $("tryBox").value = "";
  updatePatientCalcs();
  updateCharCount();
  storageLocal.set({ patientContext: {}, clinicalPadDraft: "" });
  $("tryBox").focus();
  toast("Nova consulta iniciada");
});

$("tipClose").addEventListener("click", () => {
  $("tipCard").hidden = true;
  $("tipShow").checked = false;
  storageLocal.set({ tipHidden: true });
});

$("tipShow").addEventListener("change", () => {
  const hide = !$("tipShow").checked;
  $("tipCard").hidden = hide;
  storageLocal.set({ tipHidden: hide });
});

// ---- Favoritos e Recentes na Consulta ----
function drawQuickBars() {
  const favBar = $("favBar");
  const recentBar = $("recentBar");
  const recentRow = $("recentRow");
  if (!favBar || !recentBar) return;

  favBar.textContent = "";
  const favs = sorted().filter((s) => s.fav && !s.off && s.shortcut);
  for (const s of favs) {
    favBar.append(makeQuickChip(s));
  }
  if (!favs.length) {
    const span = document.createElement("span");
    span.className = "muted small";
    span.textContent = "Marque a estrela ★ em qualquer atalho na Biblioteca para fixá-lo aqui.";
    favBar.append(span);
  }

  const recentIds = Object.entries(uses)
    .filter(([, u]) => u?.last)
    .sort((a, b) => (b[1].last ?? 0) - (a[1].last ?? 0))
    .map(([id]) => id);
  const recents = recentIds
    .map((id) => snippets.find((s) => s.id === id))
    .filter((s) => s && !s.off && s.shortcut && !s.fav)
    .slice(0, 6);

  recentBar.textContent = "";
  recentRow.hidden = !recents.length;
  for (const s of recents) recentBar.append(makeQuickChip(s));
}

const SHORT_NAMES = {
  "/soap": "SOAP + IMC",
  "/consulta": "1ª Consulta",
  "/ef": "Exame Físico + IMC",
  "/retorno": "Consulta de Retorno",
  "/checkup": "Exames de Check-up",
  "/gastro": "Anamnese Gastro",
  "/drge": "DRGE / Dispepsia",
  "/hpylori": "Erradicação H. pylori",
  "/sii": "Conduta SII",
  "/fib4": "Esteatose & FIB-4",
  "/meld": "Cirrose & MELD-Na",
  "/prep-eda": "Preparo EDA",
  "/prep-colono": "Preparo Colonoscopia",
  "/laudo-eda": "Laudo EDA / Colono",
  "/exames-gastro": "Painel Gastro/Hepato",
  "/aga": "AGA Geriatria",
  "/clcr": "ClCr Cockcroft-Gault",
  "/quedas": "Prevenção de Quedas",
  "/delirium": "Delirium e Sono",
  "/desprescricao": "Desprescrição (Beers)",
  "/receita": "Receituário Médico",
  "/atestado": "Atestado Médico",
  "/relatorio": "Relatório Médico",
  "/encaminhamento": "Encaminhamento",
  "/assinatura": "Assinatura Médica",
};

function shortLabel(s) {
  if (s.shortcut && SHORT_NAMES[s.shortcut]) return SHORT_NAMES[s.shortcut];
  const raw = (s.label || s.shortcut || "Atalho").split(" (")[0].split(" — ")[0].trim();
  if (raw.length <= 26) return raw;
  const cut = raw.slice(0, 26);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 12 ? cut.slice(0, lastSpace) : cut) + "…";
}

function makeQuickChip(s) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "q-chip";
  btn.title = `${s.label || s.shortcut} (${s.shortcut})`;
  const name = document.createElement("span");
  name.textContent = shortLabel(s);
  const code = document.createElement("code");
  code.textContent = s.shortcut;
  btn.append(name, code);
  btn.addEventListener("click", () => triggerShortcutInPad(s.shortcut));
  return btn;
}

// ---- Documento da Consulta ----
function updateCharCount() {
  const len = ($("tryBox")?.value ?? "").length;
  if ($("charCount")) $("charCount").textContent = `${len.toLocaleString("pt-BR")} caracteres`;
}

$("tryBox").addEventListener("input", () => {
  updateCharCount();
  storageLocal.set({ clinicalPadDraft: $("tryBox").value });
});

function triggerShortcutInPad(shortcut) {
  if (!shortcut) return;
  if (activeView !== "consulta") setView("consulta");
  const pad = $("tryBox");
  pad.focus();
  const start = pad.selectionStart ?? pad.value.length;
  const prefix = start > 0 && !/\s$/.test(pad.value.slice(0, start)) ? "\n\n" : "";
  const insertStr = prefix + shortcut;
  pad.setRangeText(insertStr, start, pad.selectionEnd ?? start, "end");
  updateCharCount();
  pad.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: shortcut }));
}

$("padCopy").addEventListener("click", async () => {
  const val = $("tryBox").value;
  if (!val.trim()) { toast("O documento da consulta está vazio."); return; }
  try {
    await navigator.clipboard.writeText(val);
    toast("Documento copiado para a área de transferência");
  } catch {
    $("tryBox").select();
    document.execCommand("copy");
    toast("Documento copiado");
  }
});

$("padClear").addEventListener("click", () => {
  $("tryBox").value = "";
  updateCharCount();
  storageLocal.set({ clinicalPadDraft: "" });
  $("tryBox").focus();
  toast("Documento limpo");
});

$("padPrint").addEventListener("click", () => {
  const val = $("tryBox").value.trim();
  if (!val) { toast("Expanda ou digite algum texto antes de imprimir."); return; }
  const win = window.open("", "_blank", "width=820,height=720");
  if (!win) return;
  const escaped = val.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Documento Médico — Atalhos Arcanjo</title>
    <style>body{font:14px/1.6 "Segoe UI",system-ui,sans-serif;padding:44px;max-width:760px;margin:0 auto;color:#111;white-space:pre-wrap;}</style>
    </head><body>${escaped}<script>window.onload=()=>{window.print();}</script></body></html>`);
  win.document.close();
});

// ---- Biblioteca de Atalhos (Grade de Cartões por Especialidade) ----
function sorted() {
  return [...snippets].filter((s) => !isBlankGhost(s)).sort((a, b) => (a.folder ?? "").localeCompare(b.folder ?? "") || (a.shortcut ?? "").localeCompare(b.shortcut ?? ""));
}

function plainOf(s) {
  return s.rich ? H.toText(s.html ?? "") : s.text ?? "";
}

// Transforma o código do template em um resumo limpo e legível para exibir no cartão da Biblioteca
function cleanExcerpt(s) {
  const raw = plainOf(s);
  return raw
    .replace(/\{form(?:text|paragraph|menu|date):\s*name=([^;}]+)[^}]*\}/gi, "[$1]")
    .replace(/\{formtoggle:\s*name=([^;}]+)[^}]*\}/gi, "")
    .replace(/\{(?:endformtoggle|endnote|note|else|endif|cursor|clipboard)\}/gi, "")
    .replace(/\{(?:if|elseif|key|wait|site|import):[^}]*\}/gi, "")
    .replace(/\{=imc\([^}]*\)\}/gi, "[IMC]")
    .replace(/\{=classImc\([^}]*\)\}/gi, "[Classificação IMC]")
    .replace(/\{=cockcroft\([^}]*\)\}/gi, "[ClCr]")
    .replace(/\{=estagioDrc\([^}]*\)\}/gi, "[Estágio Renal]")
    .replace(/\{=fib4\([^}]*\)\}/gi, "[FIB-4]")
    .replace(/\{=riscoFib4\([^}]*\)\}/gi, "[Risco FIB-4]")
    .replace(/\{=meld\([^}]*\)\}/gi, "[MELD-Na]")
    .replace(/\{=([^}]+)\}/g, "[$1]")
    .replace(/\{time:[^}]*\}/gi, "[Data]")
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetMetaBadges(s) {
  const src = s.rich ? (s.html ?? "") : (s.text ?? "");
  const tree = T.parse(src);
  const flds = T.fields(tree);
  const adv = T.advancedParts ? T.advancedParts(tree) : [];
  const badges = [];
  if (flds.length) badges.push({ text: `${flds.length} ${flds.length === 1 ? "campo" : "campos"}`, calc: false });
  if (adv.includes("fórmulas e calculadoras")) badges.push({ text: "Calculadora", calc: true });
  else if (adv.includes("condicionais (se/senão)")) badges.push({ text: "Condicional", calc: true });
  return badges;
}

function drawList() {
  const q = $("search").value.trim().toLowerCase();
  const list = $("list");
  const chipsBox = $("folderChips");
  list.textContent = "";
  chipsBox.textContent = "";

  const cleanSnippets = sorted();
  const allFolders = [...new Set(cleanSnippets.map((s) => s.folder).filter(Boolean))].sort();
  if (selectedFolder && selectedFolder !== "__fav__" && !allFolders.includes(selectedFolder)) {
    selectedFolder = "";
  }

  const makeChip = (val, labelText) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `chip${selectedFolder === val ? " active" : ""}`;
    b.textContent = labelText;
    b.addEventListener("click", () => { selectedFolder = val; drawList(); });
    return b;
  };

  chipsBox.append(makeChip("", `Todas (${cleanSnippets.length})`));
  const favCount = cleanSnippets.filter((s) => s.fav).length;
  chipsBox.append(makeChip("__fav__", `★ Favoritos (${favCount})`));
  for (const f of allFolders) {
    const c = cleanSnippets.filter((s) => s.folder === f).length;
    const cleanName = f.replace(/^\d+\.\s*/, "");
    chipsBox.append(makeChip(f, `${cleanName} (${c})`));
  }

  const shown = cleanSnippets.filter((s) => {
    if (selectedFolder === "__fav__" && !s.fav) return false;
    if (selectedFolder && selectedFolder !== "__fav__" && (s.folder ?? "") !== selectedFolder) return false;
    return !q || [s.shortcut, s.label, s.folder, plainOf(s)].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  $("libCount").textContent = `${shown.length} de ${cleanSnippets.length} atalhos`;

  // Agrupa os atalhos por pasta/especialidade para renderizar em seções com grade de cartões
  const groups = new Map();
  for (const s of shown) {
    const f = s.folder || "Outros Atalhos";
    if (!groups.has(f)) groups.set(f, []);
    groups.get(f).push(s);
  }

  for (const [folderName, items] of groups.entries()) {
    const section = document.createElement("div");
    section.className = "folder-section";

    const head = document.createElement("div");
    head.className = "folder-head";
    const headTitle = document.createElement("span");
    headTitle.className = "folder-head-title";
    headTitle.textContent = folderName;
    const headCount = document.createElement("span");
    headCount.className = "folder-head-count";
    headCount.textContent = `${items.length} ${items.length === 1 ? "atalho" : "atalhos"}`;
    head.append(headTitle, headCount);

    const grid = document.createElement("div");
    grid.className = "folder-grid";

    for (const s of items) {
      const card = document.createElement("div");
      card.className = `snip-row${s.off ? " off" : ""}`;
      card.tabIndex = 0;

      // Topo do cartão: Código + Badges à esquerda, Estrela + Excluir à direita
      const top = document.createElement("div");
      top.className = "snip-card-top";

      const badgesWrap = document.createElement("div");
      badgesWrap.className = "snip-badges";
      const key = document.createElement("span");
      key.className = "snip-key";
      key.textContent = s.shortcut || "(sem código)";
      badgesWrap.append(key);

      for (const b of snippetMetaBadges(s)) {
        const tag = document.createElement("span");
        tag.className = `snip-tag${b.calc ? " calc-tag" : ""}`;
        tag.textContent = b.text;
        badgesWrap.append(tag);
      }

      const iconsWrap = document.createElement("div");
      iconsWrap.className = "snip-card-icons";

      const star = document.createElement("button");
      star.type = "button";
      star.className = `snip-star${s.fav ? " on" : ""}`;
      star.title = s.fav ? "Remover dos favoritos" : "Fixar nos favoritos";
      star.setAttribute("aria-label", star.title);
      star.innerHTML = `<svg class="ic"><use href="#i-star"/></svg>`;
      star.addEventListener("click", async (e) => {
        e.stopPropagation();
        s.fav = !s.fav;
        s.edited = Date.now();
        await save();
        drawQuickBars();
        drawList();
        if (current === s.id) updateFavBtn(s);
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "snip-del";
      delBtn.title = "Excluir este atalho";
      delBtn.setAttribute("aria-label", "Excluir este atalho");
      delBtn.innerHTML = `<svg class="ic"><use href="#i-trash"/></svg>`;
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        snippets = snippets.filter((x) => x.id !== s.id);
        const { deleted = {} } = await storageLocal.get("deleted");
        const delTime = Date.now();
        deleted[s.id] = delTime;
        if (s.shortcut) deleted[`sc:${s.shortcut.trim().toLowerCase()}`] = delTime;
        await save({ deleted });
        drawQuickBars();
        drawList();
        toast(`Atalho ${s.shortcut || ""} excluído`);
      });

      iconsWrap.append(star, delBtn);
      top.append(badgesWrap, iconsWrap);

      // Corpo do cartão: Título completo + Resumo limpo sem códigos {form...}
      const main = document.createElement("div");
      main.className = "snip-main";
      const title = document.createElement("span");
      title.className = "snip-title";
      title.textContent = s.label || s.shortcut || "Atalho personalizado";
      const excerpt = document.createElement("span");
      excerpt.className = "snip-excerpt";
      excerpt.textContent = cleanExcerpt(s).slice(0, 160);
      main.append(title, excerpt);

      // Rodapé do cartão: Contagem de uso + Botões Editar e Usar
      const foot = document.createElement("div");
      foot.className = "snip-card-foot";

      const meta = document.createElement("div");
      meta.className = "snip-meta";
      const n = uses[s.id]?.n ?? 0;
      meta.textContent = n ? `Usado ${n}x` : "Pronto para uso";

      const actions = document.createElement("div");
      actions.className = "snip-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-sm";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        pick(s.id, false);
        setView("editor", s.id);
      });

      const useBtn = document.createElement("button");
      useBtn.type = "button";
      useBtn.className = "btn btn-primary btn-sm";
      useBtn.textContent = "Usar";
      useBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerShortcutInPad(s.shortcut);
      });

      actions.append(editBtn, useBtn);
      foot.append(meta, actions);

      card.append(top, main, foot);
      card.addEventListener("click", () => {
        pick(s.id, false);
        setView("editor", s.id);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { pick(s.id, false); setView("editor", s.id); }
      });
      grid.append(card);
    }

    section.append(head, grid);
    list.append(section);
  }

  if (!shown.length) {
    const empty = document.createElement("div");
    empty.className = "card empty-state";
    empty.textContent = "Nenhum atalho encontrado para este filtro.";
    list.append(empty);
  }

  const foldersDl = $("folders");
  foldersDl.textContent = "";
  for (const f of allFolders) {
    const o = document.createElement("option");
    o.value = f;
    foldersDl.append(o);
  }
}

// ---- Editor de Atalho ----
function updateFavBtn(s) {
  const btn = $("favBtn");
  if (!btn || !s) return;
  btn.setAttribute("aria-pressed", String(!!s.fav));
  btn.querySelector("span").textContent = s.fav ? "Favorito ★" : "Favoritar";
}

function pick(id, redraw = true) {
  current = id;
  const s = snippets.find((x) => x.id === id);
  $("editorBody").hidden = !s;
  $("editorEmpty").hidden = !!s;
  if (!s) { if (redraw) drawList(); return; }
  $("shortcut").value = s.shortcut ?? "";
  $("label").value = s.label ?? "";
  $("folder").value = s.folder ?? "";
  $("off").checked = !!s.off;
  $("rich").checked = !!s.rich;
  $("text").value = s.text ?? "";
  $("richText").innerHTML = s.rich ? H.sanitize(s.html ?? "") : "";
  $("editorCrumb").textContent = s.label ? `${s.shortcut || ""} · ${s.label}` : (s.shortcut || "Novo atalho");
  updateFavBtn(s);
  showMode();
  $("saved").textContent = "";
  hideAsk();
  resetDelete();
  showClash();
  showPreview();
  if (redraw) drawList();
}

function showMode() {
  const rich = $("rich").checked;
  $("text").hidden = rich;
  $("richText").hidden = !rich;
  $("formatBar").hidden = !rich;
}

function showPreview() {
  const s = snippets.find((x) => x.id === current);
  if (!s) return;
  const rich = !!s.rich;
  const resolve = (shortcut) => {
    const o = snippets.find((x) => x.shortcut === shortcut.trim() && x.id !== s.id);
    if (!o) return null;
    if (rich) return o.rich ? o.html ?? "" : H.fromText(o.text ?? "");
    return plainOf(o);
  };
  const tree = T.parse(rich ? s.html ?? "" : s.text ?? "", resolve);
  const fields = T.fields(tree);
  const values = {};
  const adv = T.advancedParts ? T.advancedParts(tree) : [];
  for (const f of fields) {
    values[f.name] = f.kind === "formtoggle" ? f.default : (f.default || `[${f.name}]`);
  }
  const ctx = {
    now: new Date(),
    clipboard: "[área de transferência]",
    site: (node) => `[página: ${node.plain[0] ?? "texto"}]`,
  };
  const parts = T.render(tree, values, ctx, rich).replace(T.CARET, "").split(T.ACTION);
  const out = parts.map((p, i) => (i ? `[${ctx.actions[i - 1]?.type === "wait" ? "pausa" : ctx.actions[i - 1]?.key}]` : "") + p).join("");
  if (rich) $("preview").innerHTML = H.sanitize(out);
  else $("preview").textContent = out;

  const note = $("proNote");
  note.hidden = !adv.length;
  note.textContent = adv.length ? `Recursos ativos: ${adv.join(", ")}.` : "";
}

function showClash() {
  const me = $("shortcut").value.trim();
  const other = me && snippets.find((s) => s.id !== current && s.shortcut && !s.off && (s.shortcut === me || me.endsWith(s.shortcut) || s.shortcut.endsWith(me)));
  const el = $("clash");
  el.hidden = !other;
  if (other) el.textContent = other.shortcut === me
    ? `O código ${other.shortcut} já está sendo usado em "${other.label || other.shortcut}".`
    : `Os códigos ${other.shortcut} e ${me} se sobrepõem (o mais curto dispara primeiro).`;
}

let saveTimer = 0;
let saving = false;
function edited() {
  const s = snippets.find((x) => x.id === current);
  if (!s) return;
  s.shortcut = $("shortcut").value.trim();
  s.label = $("label").value.trim();
  s.folder = $("folder").value.trim();
  s.off = $("off").checked;
  if (s.rich) s.html = H.sanitize($("richText").innerHTML);
  else s.text = $("text").value;
  s.edited = Date.now();
  $("editorCrumb").textContent = s.label ? `${s.shortcut || ""} · ${s.label}` : (s.shortcut || "Atalho");
  showClash();
  showPreview();
  drawQuickBars();
  drawList();
  clearTimeout(saveTimer);
  $("saved").textContent = "Salvando…";
  saveTimer = setTimeout(save, 250);
}

async function save(extra = {}) {
  saving = true;
  try {
    await storageLocal.set({ snippets, ...extra });
  } finally {
    saving = false;
  }
  $("saved").textContent = "Salvo";
  scheduleCloudPush();
}

for (const id of ["shortcut", "label", "folder", "text"]) $(id).addEventListener("input", edited);
$("richText").addEventListener("input", edited);
$("off").addEventListener("change", edited);
$("search").addEventListener("input", drawList);

$("favBtn").addEventListener("click", async () => {
  const s = snippets.find((x) => x.id === current);
  if (!s) return;
  s.fav = !s.fav;
  s.edited = Date.now();
  updateFavBtn(s);
  await save();
  drawQuickBars();
  drawList();
  toast(s.fav ? "Adicionado aos favoritos" : "Removido dos favoritos");
});

$("rich").addEventListener("change", () => {
  const s = snippets.find((x) => x.id === current);
  if (!s) return;
  if ($("rich").checked) {
    s.rich = true;
    s.html = H.fromText($("text").value);
    $("richText").innerHTML = s.html;
  } else {
    s.rich = false;
    s.text = H.toText(H.sanitize($("richText").innerHTML));
    delete s.html;
    $("text").value = s.text;
  }
  showMode();
  edited();
});

let lastRange = null;
document.addEventListener("selectionchange", () => {
  const sel = document.getSelection();
  if (sel.rangeCount && $("richText").contains(sel.anchorNode)) lastRange = sel.getRangeAt(0).cloneRange();
});
function focusRich() {
  const el = $("richText");
  el.focus();
  if (lastRange && el.contains(lastRange.startContainer)) {
    const sel = document.getSelection();
    sel.removeAllRanges();
    sel.addRange(lastRange);
  }
}

// Fecha menus dropdown da barra do editor ao escolher um item ou clicar fora
document.addEventListener("click", (e) => {
  for (const d of document.querySelectorAll("details.menu[open]")) {
    if (!d.contains(e.target)) d.removeAttribute("open");
  }
});

for (const b of document.querySelectorAll(".menu-pop button, .format-bar button")) {
  b.addEventListener("mousedown", (e) => e.preventDefault());
}

function insertToken(token) {
  if ($("rich").checked) {
    focusRich();
    document.execCommand("insertText", false, token);
  } else {
    const ta = $("text");
    ta.focus();
    ta.setRangeText(token, ta.selectionStart, ta.selectionEnd, "end");
    edited();
  }
}

for (const pop of document.querySelectorAll(".menu-pop")) {
  pop.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-insert]");
    if (!btn) return;
    const menu = btn.closest("details.menu");
    if (menu) menu.removeAttribute("open");
    insertToken(btn.dataset.insert);
  });
}

$("formatBar").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cmd]");
  if (!btn) return;
  const cmd = btn.dataset.cmd;
  if (cmd === "link") { ask("Endereço do link (https://…)", (url) => { if (/^(https?:|mailto:)/i.test(url)) { focusRich(); document.execCommand("createLink", false, url); } }); return; }
  if (cmd === "image") { ask("Endereço da imagem (https://…)", (url) => { if (/^https:/i.test(url)) { focusRich(); document.execCommand("insertImage", false, url); } }); return; }
  focusRich();
  document.execCommand(cmd);
});

$("importBtn").addEventListener("click", () => {
  const others = snippets.filter((s) => s.id !== current && s.shortcut).map((s) => s.shortcut);
  ask(others.length ? `Código do atalho para incluir (ex.: ${others.includes("/assinatura") ? "/assinatura" : others[0]})` : "Código do atalho para incluir (ex.: /assinatura)", (shortcut) => insertToken(`{import: ${shortcut}}`));
});

let askDone = null;
function ask(placeholder, then) {
  $("ask").hidden = false;
  $("askInput").value = "";
  $("askInput").placeholder = placeholder;
  $("askInput").focus();
  askDone = then;
}
function hideAsk() { $("ask").hidden = true; askDone = null; }
$("askOk").addEventListener("click", () => { const v = $("askInput").value.trim(); const then = askDone; hideAsk(); if (v && then) then(v); });
$("askCancel").addEventListener("click", hideAsk);
$("askInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); $("askOk").click(); }
  if (e.key === "Escape") hideAsk();
});

$("add").addEventListener("click", async () => {
  const now = Date.now();
  const defaultFolder = (selectedFolder && selectedFolder !== "__fav__")
    ? selectedFolder
    : (snippets.find((x) => x.id === current)?.folder || "01. Clínica Médica & Alto Fluxo");
  const s = { id: newId(), shortcut: "/", label: "", folder: defaultFolder, text: "", fav: false, created: now, edited: now };
  snippets.unshift(s);
  await save();
  $("search").value = "";
  pick(s.id, true);
  setView("editor", s.id);
  $("shortcut").focus();
  $("shortcut").setSelectionRange(1, 1);
  toast("Novo atalho criado");
});

$("duplicateBtn").addEventListener("click", async () => {
  const orig = snippets.find((x) => x.id === current);
  if (!orig) return;
  const now = Date.now();
  const copy = {
    ...orig,
    id: newId(),
    shortcut: orig.shortcut ? `${orig.shortcut}-copia` : "/copia",
    label: orig.label ? `${orig.label} (Cópia)` : "Cópia",
    created: now,
    edited: now,
  };
  snippets.unshift(copy);
  await save();
  pick(copy.id, true);
  setView("editor", copy.id);
  $("shortcut").focus();
  toast("Atalho duplicado");
});

$("runInPad").addEventListener("click", () => {
  const s = snippets.find((x) => x.id === current);
  if (s?.shortcut) triggerShortcutInPad(s.shortcut);
});

function newId() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

let armed = false;
function resetDelete() {
  armed = false;
  const span = $("delete")?.querySelector("span");
  if (span) span.textContent = "Excluir";
}
$("delete").addEventListener("click", async () => {
  const span = $("delete")?.querySelector("span");
  if (!armed) {
    armed = true;
    if (span) span.textContent = "Confirmar exclusão";
    return;
  }
  const order = sorted();
  const i = order.findIndex((x) => x.id === current);
  const targetSnip = snippets.find((x) => x.id === current);
  snippets = snippets.filter((x) => x.id !== current);
  const { deleted = {} } = await storageLocal.get("deleted");
  const delTime = Date.now();
  deleted[current] = delTime;
  if (targetSnip?.shortcut) deleted[`sc:${targetSnip.shortcut.trim().toLowerCase()}`] = delTime;
  await save({ deleted });
  drawQuickBars();
  const next = order.filter((x) => x.id !== current)[Math.min(i, order.length - 2)];
  pick(next?.id ?? null, true);
  setView("biblioteca");
  toast("Atalho excluído");
});
$("delete").addEventListener("blur", resetDelete);

// ---- Configurações e Assinatura Médica ----
function buildSignatureText(sig) {
  const nome = (sig.nome || "").trim() || "Médico(a)";
  const esp = (sig.esp || "").trim() || "Clínica Médica · Gastroenterologia · Geriatria";
  const crm = (sig.crm || "").trim() || "_______________";
  const rqe = (sig.rqe || "").trim();
  const extra = (sig.extra || "").trim();
  const lines = [
    "__________________________________________",
    nome,
    esp,
    rqe ? `CRM: ${crm} | RQE: ${rqe}` : `CRM: ${crm}`,
  ];
  if (extra) lines.push(extra);
  return lines.join("\n");
}

function loadSignatureForm() {
  const sig = settings.signature ?? {};
  $("sigNome").value = sig.nome ?? "";
  $("sigEsp").value = sig.esp ?? "Clínica Médica · Gastroenterologia · Geriatria";
  $("sigCrm").value = sig.crm ?? "";
  $("sigRqe").value = sig.rqe ?? "";
  $("sigExtra").value = sig.extra ?? "";
  updateSigPreview();
}

function readSigInputs() {
  return {
    nome: $("sigNome").value.trim(),
    esp: $("sigEsp").value.trim(),
    crm: $("sigCrm").value.trim(),
    rqe: $("sigRqe").value.trim(),
    extra: $("sigExtra").value.trim(),
  };
}

function updateSigPreview() {
  $("sigPreview").textContent = buildSignatureText(readSigInputs());
}

for (const id of ["sigNome", "sigEsp", "sigCrm", "sigRqe", "sigExtra"]) {
  $(id).addEventListener("input", updateSigPreview);
}

$("saveSig").addEventListener("click", async () => {
  const sig = readSigInputs();
  const text = buildSignatureText(sig);
  const now = Date.now();
  settings = { ...settings, signature: sig, signatureUpdatedAt: now };
  let s = snippets.find((x) => x.shortcut === "/assinatura");
  if (s) {
    s.text = text;
    delete s.rich;
    delete s.html;
    s.edited = now;
  } else {
    s = {
      id: newId(),
      shortcut: "/assinatura",
      label: "Assinatura Médica Padrão (Usada nos Documentos)",
      folder: "04. Prescrições, Atestados & Documentos",
      text,
      created: now,
      edited: now,
    };
    snippets.push(s);
  }
  await storageLocal.set({ settings, snippets });
  scheduleCloudPush();
  if (current === s.id) pick(s.id, false);
  drawList();
  toast("Assinatura médica salva e sincronizada na nuvem");
});

$("enabled").addEventListener("change", saveSettings);
$("syncOn").addEventListener("change", saveSettings);
$("cloudSyncOn")?.addEventListener("change", saveSettings);
$("cloudKey")?.addEventListener("change", saveSettings);
$("cloudSyncNow")?.addEventListener("click", async () => {
  toast("Sincronizando com a nuvem…");
  const ok = await cloudPush();
  toast(ok ? "Sincronizado com a nuvem em todos os computadores!" : "Não foi possível conectar à nuvem agora.");
});
$("patientEverywhere").addEventListener("change", saveSettings);
$("blocked").addEventListener("change", saveSettings);
$("themeSelect").addEventListener("change", () => {
  applyTheme($("themeSelect").value);
  void saveSettings();
});
$("themeToggle").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  $("themeSelect").value = next;
  applyTheme(next);
  void saveSettings();
});

async function saveSettings() {
  const blockedSites = $("blocked").value.split(/[,\s]+/).map((h) => h.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "")).filter(Boolean);
  settings = {
    ...settings,
    enabled: $("enabled").checked,
    sync: $("syncOn").checked,
    cloudSync: $("cloudSyncOn") ? $("cloudSyncOn").checked : true,
    cloudKey: ($("cloudKey")?.value || DEFAULT_CLOUD_KEY).trim(),
    patientEverywhere: $("patientEverywhere").checked,
    theme: $("themeSelect").value || "auto",
    blockedSites,
  };
  await storageLocal.set({ settings });
  if (settings.cloudSync) scheduleCloudPush();
  else if (!settings.sync) showSync({ off: true });
}

// ---- Backup, Importação e Restauração ----
$("export").addEventListener("click", () => {
  const out = {
    app: "atalhos-arcanjo", version: 3,
    snippets: sorted().map(({ shortcut, label, folder, text, rich, html, off, fav }) => ({
      shortcut, label,
      ...(folder ? { folder } : {}),
      ...(rich ? { rich, html } : { text }),
      ...(off ? { off } : {}),
      ...(fav ? { fav } : {}),
    })),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "atalhos-arcanjo-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Backup exportado");
});

$("import").addEventListener("click", () => $("file").click());
$("file").addEventListener("change", async () => {
  const file = $("file").files[0];
  $("file").value = "";
  if (!file) return;
  const raw = await file.text();
  let incoming = [];
  try { incoming = /\.csv$/i.test(file.name) ? readCsv(raw) : readJson(JSON.parse(raw)); } catch { incoming = []; }
  if (!incoming.length) { toast("Arquivo sem atalhos compatíveis."); return; }
  const now = Date.now();
  let added = 0, updated = 0;
  for (const s of incoming) {
    const same = s.shortcut && snippets.find((x) => x.shortcut === s.shortcut);
    if (same) { Object.assign(same, s, { edited: now }); if (!s.rich) { delete same.rich; delete same.html; } updated++; }
    else { snippets.push({ id: newId(), created: now, edited: now, ...s }); added++; }
  }
  await save();
  drawQuickBars();
  drawList();
  toast(`Importados ${added} novos e ${updated} atualizados`);
});

$("restoreMedical").addEventListener("click", async () => {
  if (!STARTERS.length) return;
  const now = Date.now();
  let added = 0;
  for (const s of STARTERS) {
    const exists = snippets.find((x) => x.shortcut === s.shortcut);
    if (!exists) {
      snippets.push({ id: newId(), created: now, edited: now, fav: DEFAULT_FAVS.has(s.shortcut), ...s });
      added++;
    }
  }
  await save();
  drawQuickBars();
  drawList();
  toast(added ? `${added} atalhos médicos restaurados` : "Todos os atalhos padrão já estão na biblioteca");
});

function readJson(data) {
  const out = [];
  const one = (s, folder) => {
    const shortcut = String(s.shortcut ?? s.abbreviation ?? s.trigger ?? "").trim();
    const label = String(s.label ?? s.name ?? s.title ?? "");
    const f = String(s.folder ?? folder ?? "");
    const fav = !!s.fav;
    if (s.rich && s.html) { out.push({ shortcut, label, folder: f, fav, rich: true, html: H.sanitize(String(s.html)) }); return; }
    const text = String(s.text ?? s.content ?? s.body ?? s.snippet ?? "");
    if (text) out.push({ shortcut, label, folder: f, fav, text });
  };
  if (Array.isArray(data?.folders)) for (const f of data.folders) for (const s of f.snippets ?? []) one(s, f.name);
  const list = Array.isArray(data) ? data : Array.isArray(data?.snippets) ? data.snippets : [];
  for (const s of list) one(s);
  return out;
}

function readCsv(raw) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (quoted) {
      if (c === '"' && raw[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && raw[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  const col = (...names) => head.findIndex((h) => names.includes(h));
  const sc = col("shortcut", "abbreviation", "trigger", "atalho"), tx = col("snippet", "text", "content", "texto"), nm = col("name", "label", "title", "nome"), fd = col("folder", "pasta");
  if (sc < 0 || tx < 0) return [];
  return rows.filter((r) => r[tx]).map((r) => ({ shortcut: (r[sc] ?? "").trim(), label: nm >= 0 ? r[nm] ?? "" : "", folder: fd >= 0 ? r[fd] ?? "" : "", text: r[tx] }));
}

// ---- Tela Instalar Extensão ----
async function copyWithToast(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} copiado (Ctrl+V para colar)`);
  } catch {
    toast(`Copie manualmente: ${text}`);
  }
}
$("copyFolderPath")?.addEventListener("click", () => copyWithToast($("folderPathCode").textContent.trim(), "Caminho da pasta"));
$("copyChromeExtUrl")?.addEventListener("click", () => copyWithToast("chrome://extensions", "Endereço chrome://extensions"));
$("copyEdgeExtUrl")?.addEventListener("click", () => copyWithToast("edge://extensions", "Endereço edge://extensions"));

// ---- Paleta de Comandos (Ctrl+K) ----
const cmdkDialog = $("cmdk");
const cmdkInput = $("cmdkInput");
const cmdkList = $("cmdkList");
let cmdkItems = [];
let cmdkAt = 0;

function openCmdk() {
  if (!cmdkDialog) return;
  cmdkInput.value = "";
  cmdkAt = 0;
  drawCmdk();
  try { cmdkDialog.showModal(); } catch { cmdkDialog.setAttribute("open", ""); }
  cmdkInput.focus();
}

function closeCmdk() {
  if (!cmdkDialog) return;
  try { cmdkDialog.close(); } catch { cmdkDialog.removeAttribute("open"); }
}

function buildCmdkEntries(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const actions = [
    { kind: "action", title: "Nova consulta (limpar paciente e documento)", sub: "Ação rápida", run: () => $("newConsult").click() },
    { kind: "action", title: "Copiar documento da consulta", sub: "Ação rápida", run: () => $("padCopy").click() },
    { kind: "action", title: "Criar novo atalho", sub: "Biblioteca", run: () => $("add").click() },
    { kind: "action", title: "Abrir Biblioteca de Atalhos", sub: "Navegação", run: () => setView("biblioteca") },
    { kind: "action", title: "Configurar Assinatura Médica (CRM / RQE)", sub: "Configurações", run: () => setView("config") },
  ];
  const snipEntries = sorted().filter((s) => !s.off && s.shortcut).map((s) => ({
    kind: "snippet",
    title: `${s.label || s.shortcut}`,
    code: s.shortcut,
    sub: s.folder || "Atalho",
    hay: `${s.shortcut} ${s.label} ${s.folder} ${plainOf(s)}`.toLowerCase(),
    run: () => triggerShortcutInPad(s.shortcut),
  }));
  const allEntries = [
    ...snipEntries,
    ...actions.map((a) => ({ ...a, hay: `${a.title} ${a.sub}`.toLowerCase() })),
  ];
  return allEntries.filter((it) => words.every((w) => it.hay.includes(w))).slice(0, 12);
}

function drawCmdk() {
  cmdkItems = buildCmdkEntries(cmdkInput.value.trim());
  cmdkAt = Math.min(cmdkAt, Math.max(0, cmdkItems.length - 1));
  cmdkList.textContent = "";
  cmdkItems.forEach((it, i) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", String(i === cmdkAt));
    const left = document.createElement("div");
    const t = document.createElement("div");
    t.className = "c-title";
    t.textContent = it.title;
    const s = document.createElement("div");
    s.className = "c-sub";
    s.textContent = it.sub;
    left.append(t, s);
    li.append(left);
    if (it.code) {
      const code = document.createElement("code");
      code.textContent = it.code;
      li.append(code);
    }
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      closeCmdk();
      it.run();
    });
    cmdkList.append(li);
  });
}

$("cmdkOpen")?.addEventListener("click", openCmdk);
cmdkInput?.addEventListener("input", () => { cmdkAt = 0; drawCmdk(); });
cmdkDialog?.addEventListener("click", (e) => { if (e.target === cmdkDialog) closeCmdk(); });
cmdkDialog?.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { e.preventDefault(); closeCmdk(); }
  else if (e.key === "ArrowDown") { e.preventDefault(); cmdkAt = Math.min(cmdkAt + 1, cmdkItems.length - 1); drawCmdk(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); cmdkAt = Math.max(cmdkAt - 1, 0); drawCmdk(); }
  else if (e.key === "Enter" && cmdkItems[cmdkAt]) {
    e.preventDefault();
    const chosen = cmdkItems[cmdkAt];
    closeCmdk();
    chosen.run();
  }
});

window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (cmdkDialog?.open) closeCmdk();
    else openCmdk();
  }
});

globalThis.__typefillOptions = { showPreview };

start();
