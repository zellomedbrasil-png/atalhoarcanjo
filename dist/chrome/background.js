// Script de segundo plano (Background / Service Worker) do Atalhos Arcanjo.
// Carrega o pacote médico inicial na primeira instalação, registra contagens de uso,
// abre a busca rápida (Ctrl+Shift+Space) e sincroniza entre computadores pela nuvem (Vercel + Extensão) e conta do navegador.

if (typeof importScripts === "function" && !globalThis.MEDICAL_STARTERS) {
  try { importScripts("medical-starters.js"); } catch { /* ignore */ }
}

const api = globalThis.browser ?? globalThis.chrome;
const STARTERS = globalThis.MEDICAL_STARTERS ?? [
  { shortcut: "/hoje", label: "Data de hoje", folder: "05. Comunicação & Uso Geral", text: "{time: DD/MM/YYYY}" }
];

const DEFAULT_FAVS = new Set([
  "/soap", "/ef", "/gastro", "/drge", "/hpylori", "/sii", "/fib4", "/aga", "/clcr", "/receita", "/atestado"
]);
const DEFAULT_CLOUD_KEY = "arcanjo-zellomed-8f92a1c4-7b3d-4e5f";
const CLOUD_ENDPOINT = "https://textdb.dev/api/data/";

api.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== "install") return;
  void addToOpenTabs();
  const { snippets } = await api.storage.local.get("snippets");
  if (!snippets || !snippets.length) {
    await api.storage.local.set({
      snippets: STARTERS.map((s, i) => ({
        id: `starter_${(s.shortcut || String(i)).replace(/[^a-z0-9]/gi, "")}`,
        ...s,
        fav: DEFAULT_FAVS.has(s.shortcut),
        folder: s.folder || "01. Clínica Médica & Alto Fluxo",
        created: 1000,
        edited: 1000,
      })),
    });
  }
  void pullCloud().then(() => pull());
  api.runtime.openOptionsPage();
});

api.action.onClicked.addListener(() => api.runtime.openOptionsPage());

async function addToOpenTabs() {
  if (!api.scripting) return;
  const scripts = api.runtime.getManifest().content_scripts ?? [];
  const tabs = await api.tabs.query({ url: ["http://*/*", "https://*/*"] });
  await Promise.all(tabs.map(async (tab) => {
    for (const c of scripts) {
      try {
        await api.scripting.executeScript({ target: { tabId: tab.id, allFrames: !!c.all_frames }, files: c.js, world: c.world ?? "ISOLATED", injectImmediately: true });
      } catch { break; }
    }
  }));
}

api.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "open-search") return;
  const id = tab?.id ?? (await api.tabs.query({ active: true, currentWindow: true }))[0]?.id;
  if (id != null) api.tabs.sendMessage(id, { type: "search" }).catch(() => {});
});

let queue = Promise.resolve();
api.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "used" && msg.id) {
    queue = queue.then(async () => {
      const { uses = {} } = await api.storage.local.get("uses");
      uses[msg.id] = { n: (uses[msg.id]?.n ?? 0) + 1, last: Date.now() };
      await api.storage.local.set({ uses });
    }).catch(() => {});
  }
  if (msg?.type === "sync-now") void pullCloud().then(() => pull()).then(push);
});

// ---- Sincronização Multi-Computador (Nuvem Web + Conta do Navegador) ----
const PIECE = 3000;
const LIMIT = 90000;
let applying = false;
let pushTimer = 0;

async function device() {
  const { device } = await api.storage.local.get("device");
  if (device) return device;
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  await api.storage.local.set({ device: id });
  return id;
}

async function syncOn() {
  const { settings = {} } = await api.storage.local.get("settings");
  return settings.sync !== false;
}

async function cloudInfo() {
  const { settings = {} } = await api.storage.local.get("settings");
  const on = settings.cloudSync !== false;
  const key = String(settings.cloudKey || DEFAULT_CLOUD_KEY).trim().replace(/[^a-zA-Z0-9_-]/g, "");
  return { on, key };
}

async function setState(state) {
  await api.storage.local.set({ syncState: { ...state, checked: Date.now() } });
}

function stamp(s) {
  return s?.edited ?? s?.created ?? 0;
}

function merge(local, localDeleted, remote, remoteDeleted) {
  const deleted = { ...(localDeleted ?? {}) };
  for (const [id, at] of Object.entries(remoteDeleted ?? {})) deleted[id] = Math.max(deleted[id] ?? 0, at);
  const byKey = new Map();
  const keyFor = (s) => (s.shortcut ? `sc:${s.shortcut.trim().toLowerCase()}` : `id:${s.id}`);
  for (const s of [...(local ?? []), ...(remote ?? [])]) {
    if (!s) continue;
    const k = keyFor(s);
    const have = byKey.get(k);
    if (!have || stamp(s) > stamp(have)) byKey.set(k, s);
  }
  const snippets = [...byKey.values()].filter((s) => {
    const delAt = Math.max(deleted[s.id] ?? 0, s.shortcut ? (deleted[`sc:${s.shortcut.trim().toLowerCase()}`] ?? 0) : 0);
    return !(delAt >= stamp(s));
  });
  return { snippets, deleted };
}

async function pullCloud() {
  const { on, key } = await cloudInfo();
  if (!on || !key) return;
  try {
    const res = await fetch(`${CLOUD_ENDPOINT}${key}`, { cache: "no-store" });
    if (!res.ok) return;
    const raw = (await res.text()).trim();
    if (!raw) return;
    const remote = JSON.parse(raw);
    if (!Array.isArray(remote?.snippets)) return;
    const local = await api.storage.local.get(["snippets", "deleted"]);
    const merged = merge(local.snippets ?? [], local.deleted ?? {}, remote.snippets, remote.deleted);
    applying = true;
    try {
      await api.storage.local.set(merged);
    } finally {
      applying = false;
    }
  } catch { /* ignore */ }
}

async function pushCloud() {
  const { on, key } = await cloudInfo();
  if (!on || !key) return;
  try {
    const { snippets = [], deleted = {}, settings = {} } = await api.storage.local.get(["snippets", "deleted", "settings"]);
    const payload = {
      app: "atalhos-arcanjo",
      at: Date.now(),
      snippets,
      deleted,
      signature: settings.signature ?? null,
      signatureUpdatedAt: settings.signatureUpdatedAt ?? 0,
    };
    await fetch(`${CLOUD_ENDPOINT}${key}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
  } catch { /* ignore */ }
}

async function pull() {
  if (!(await syncOn())) return;
  const meta = (await api.storage.sync.get("meta")).meta;
  if (!meta?.n) return;
  const { lastPulled = 0 } = await api.storage.local.get("lastPulled");
  const me = await device();
  if (meta.device === me || meta.at <= lastPulled) return;
  const keys = Array.from({ length: meta.n }, (_, i) => `p${i}`);
  const pieces = await api.storage.sync.get(keys);
  if (keys.some((k) => typeof pieces[k] !== "string")) return;
  let remote;
  try { remote = JSON.parse(keys.map((k) => pieces[k]).join("")); } catch { return; }
  if (remote.at !== meta.at) return;
  const local = await api.storage.local.get(["snippets", "deleted"]);
  const merged = merge(local.snippets ?? [], local.deleted ?? {}, remote.snippets, remote.deleted);
  applying = true;
  try {
    await api.storage.local.set({ ...merged, lastPulled: meta.at });
  } finally {
    applying = false;
  }
  await setState({ ok: true, at: meta.at });
}

async function push() {
  void pushCloud();
  if (!(await syncOn())) { await setState({ ok: false, off: true }); return; }
  const { snippets = [], deleted = {} } = await api.storage.local.get(["snippets", "deleted"]);
  const cutoff = Date.now() - 60 * 864e5;
  for (const [id, at] of Object.entries(deleted)) if (at < cutoff) delete deleted[id];
  const at = Date.now();
  const body = JSON.stringify({ at, snippets, deleted });
  const pieces = [];
  for (let i = 0; i < body.length; i += PIECE) pieces.push(body.slice(i, i + PIECE));
  const size = pieces.reduce((n, p) => n + JSON.stringify(p).length + 4, 0);
  if (size > LIMIT) {
    await setState({ ok: false, tooBig: true, size, limit: LIMIT });
    return;
  }
  const old = (await api.storage.sync.get("meta")).meta;
  const items = { meta: { n: pieces.length, at, device: await device() } };
  pieces.forEach((p, i) => { items[`p${i}`] = p; });
  try {
    await api.storage.sync.set(items);
    if (old?.n > pieces.length) await api.storage.sync.remove(Array.from({ length: old.n - pieces.length }, (_, i) => `p${pieces.length + i}`));
    await setState({ ok: true, at, size, limit: LIMIT });
  } catch (err) {
    await setState({ ok: false, error: String(err?.message ?? err) });
  }
}

api.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.meta) void pull();
  if (area === "local" && (changes.snippets || changes.deleted) && !applying) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void push(), 2000);
  }
  if (area === "local" && changes.settings && changes.settings.newValue?.sync !== changes.settings.oldValue?.sync) void pull().then(push);
});

void pullCloud().then(() => pull());
