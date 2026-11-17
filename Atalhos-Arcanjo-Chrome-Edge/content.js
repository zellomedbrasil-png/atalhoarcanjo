// Monitora a digitação em qualquer página. Quando o texto antes do cursor termina com o código de um atalho,
// substitui o código pelo texto expandido. Atalhos com campos interativos abrem um modal rápido antes de inserir,
// já pré-preenchido com os Dados do Paciente quando disponíveis.

(() => {
  "use strict";
  if (globalThis.__typefill) return;
  globalThis.__typefill = true;

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
    }
  };

  const T = globalThis.TFTemplate;
  const H = globalThis.TFHtml;

  let all = [];
  let snippets = [];
  let longest = 0;
  let enabled = true;
  let settingsCache = {};
  let patientCache = {};

  const extBaseUrl = rawApi?.runtime?.getURL ? rawApi.runtime.getURL("") : "options.html";
  const ownPage = (rawApi?.runtime?.getURL && location.href.startsWith(extBaseUrl))
    || /\/options\.html(\?|#|$)/.test(location.pathname)
    || !!document.querySelector('meta[name="arcanjo-app"]');
  const allowed = (el) => !ownPage || !!el?.closest?.("[data-typefill-try]");

  async function load() {
    const { snippets: list = [], settings = {}, patientContext = {} } = await storageLocal.get(["snippets", "settings", "patientContext"]);
    all = list.filter((s) => s && !s.deleted);
    snippets = all.filter((s) => s.shortcut && !s.off).sort((a, b) => b.shortcut.length - a.shortcut.length);
    longest = snippets.reduce((n, s) => Math.max(n, s.shortcut.length), 0);
    settingsCache = settings;
    patientCache = patientContext ?? {};
    enabled = settings.enabled !== false && !(settings.blockedSites ?? []).some((h) => hostMatches(h));
  }
  load();

  if (rawApi?.storage?.onChanged) {
    rawApi.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && (changes.snippets || changes.settings || changes.patientContext)) load();
    });
  }
  window.addEventListener("aa-storage-changed", () => load());

  // Normaliza o nome do campo do atalho para casar com os Dados do Paciente
  const PT_ALIASES = {
    "nome": "nome",
    "nome do paciente": "nome",
    "paciente": "nome",
    "idade": "idade",
    "sexo": "sexo",
    "peso": "peso",
    "altura": "altura",
    "pa": "pa",
    "pressao arterial": "pa",
    "fc": "fc",
    "frequencia cardiaca": "fc",
    "creatinina": "creatinina",
    "creatinina serica": "creatinina",
    "plaquetas": "plaquetas",
    "ast": "ast",
    "tgo": "ast",
    "ast / tgo": "ast",
    "alt": "alt",
    "tgp": "alt",
    "alt / tgp": "alt",
    "bilirrubina": "bilirrubina",
    "bilirrubina total": "bilirrubina",
    "inr": "inr",
    "sodio": "sodio",
    "sodio serico": "sodio",
  };

  function normFieldKey(raw) {
    const clean = String(raw ?? "")
      .replace(/\(.*?\)/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
    return PT_ALIASES[clean] ?? null;
  }

  function applyPatientDefaults(fields) {
    const shouldApply = ownPage || !!settingsCache.patientEverywhere;
    if (!shouldApply) return;
    const pt = (typeof globalThis.__arcanjoPatient === "function" ? globalThis.__arcanjoPatient() : null) ?? patientCache ?? {};
    for (const f of fields) {
      const key = normFieldKey(f.name);
      if (!key) continue;
      const val = String(pt[key] ?? "").trim();
      if (!val) continue;
      if (f.kind === "formmenu" && Array.isArray(f.options)) {
        const hit = f.options.find((o) => o.toLowerCase() === val.toLowerCase() || o.toLowerCase().startsWith(val.toLowerCase()));
        if (hit) f.default = hit;
      } else if (f.kind === "formtext") {
        f.default = val;
      }
    }
  }

  function hostMatches(pattern) {
    const host = topHost();
    const p = String(pattern).trim().toLowerCase().replace(/^\*\./, "");
    return !!p && (host === p || host.endsWith("." + p));
  }

  function topHost() {
    try { return window.top.location.hostname.toLowerCase(); } catch { return location.hostname.toLowerCase(); }
  }

  function match(before) {
    if (!before) return null;
    for (const s of snippets) if (before.endsWith(s.shortcut)) return s;
    return null;
  }

  const inDocsFrame = (() => {
    try { return !!window.frameElement?.classList.contains("docs-texteventtarget-iframe"); } catch { return false; }
  })();

  let busy = false;
  let holding = false;
  let held = "";

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "Space" && enabled && !busy) {
      const target = currentTarget();
      if (target) {
        e.preventDefault();
        e.stopImmediatePropagation();
        void openSearch(target);
        return;
      }
    }
    if (!holding || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    held += e.key;
  }, true);

  if (inDocsFrame) watchDocs();
  else {
    document.addEventListener("input", onInput, true);
    document.addEventListener("keydown", (e) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) setTimeout(() => onInput({}), 0);
    }, true);
  }

  if (rawApi?.runtime?.onMessage) {
    rawApi.runtime.onMessage.addListener((msg) => {
      if (msg?.type === "search" && enabled && !busy && document.hasFocus()) {
        const target = currentTarget();
        if (target) void openSearch(target);
      }
    });
  }

  function onInput(e) {
    if (!enabled || busy || !snippets.length) return;
    if (e.inputType && e.inputType !== "insertText" && e.inputType !== "insertCompositionText") return;
    const el = deepActive();
    if (!el || !allowed(el)) return;
    if (isTextField(el)) {
      if (el.selectionStart !== el.selectionEnd || el.selectionStart == null) return;
      const before = el.value.slice(Math.max(0, el.selectionStart - longest), el.selectionStart);
      const s = match(before);
      if (s) void expand({ kind: "field", el, start: el.selectionStart - s.shortcut.length, end: el.selectionStart }, s, s.shortcut);
      return;
    }
    const host = editableHost(el);
    if (!host) return;
    const sel = selectionFor(host);
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return;
    const s = match(textBeforeCaret(sel, host));
    if (s) void expand({ kind: "editable", el: host }, s, s.shortcut);
  }

  function currentTarget() {
    if (inDocsFrame) return docsTarget();
    const el = deepActive();
    if (el && !allowed(el)) return null;
    if (el && isTextField(el)) return { kind: "field", el, start: el.selectionStart ?? el.value.length, end: el.selectionEnd ?? el.value.length };
    const host = el && editableHost(el);
    return host ? { kind: "editable", el: host } : null;
  }

  function deepActive() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    return el;
  }

  function isTextField(el) {
    if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
    if (!(el instanceof HTMLInputElement) || el.readOnly || el.disabled) return false;
    return ["text", "search", "url", "email", "tel", "number", ""].includes(el.type);
  }

  function editableHost(el) {
    if (!(el instanceof HTMLElement) || !el.isContentEditable) return null;
    return el;
  }

  function selectionFor(el) {
    return el.getRootNode().getSelection?.() ?? document.getSelection();
  }

  function textBeforeCaret(sel, host, length = longest) {
    const r = sel.getRangeAt(0);
    const node = r.endContainer;
    if (node.nodeType === Node.TEXT_NODE && r.endOffset >= length) return node.data.slice(r.endOffset - length, r.endOffset);
    const pre = document.createRange();
    pre.selectNodeContents(host);
    pre.setEnd(node, r.endOffset);
    return pre.toString().slice(-length);
  }

  const squash = (s) => s.replace(/\s+/g, "").split(T.CARET).join("");

  async function settled(el, text) {
    const tail = squash(text).slice(-12);
    let last = performance.now();
    const watch = new MutationObserver(() => { last = performance.now(); });
    watch.observe(el, { childList: true, subtree: true, characterData: true });
    try {
      const start = performance.now();
      while (performance.now() - start < 1000) {
        await new Promise((r) => setTimeout(r, 20));
        const sel = selectionFor(el);
        const there = !tail || (sel?.rangeCount && squash(textBeforeCaret(sel, el, 80)).endsWith(tail));
        if (there && performance.now() - last >= 60) return;
      }
    } finally {
      watch.disconnect();
    }
  }

  function caretBack(el, text, back) {
    const sel = selectionFor(el);
    const before = text.slice(0, text.length - back);
    const rest = text.slice(text.length - back);
    const want = squash(before).slice(-16);
    if (!want) {
      for (let i = 0; i < back; i++) sel.modify("move", "backward", "character");
      return;
    }
    const matches = () => squash(textBeforeCaret(sel, el, 80)).endsWith(want);
    for (let i = 0; i <= back + 20; i++) {
      if (i > 0) sel.modify("move", "backward", "character");
      if (i < Math.max(0, back - 4) || !matches()) continue;
      const lead = /^\s*/.exec(rest)[0].length;
      for (let j = 0; j < lead; j++) {
        sel.modify("move", "backward", "character");
        if (!matches()) { sel.modify("move", "forward", "character"); break; }
      }
      return;
    }
  }

  function prepare(snippet) {
    const rich = !!(snippet.rich && snippet.html);
    const resolve = (shortcut) => {
      const s = all.find((x) => x.shortcut === shortcut.trim());
      if (!s) return null;
      const sRich = !!(s.rich && s.html);
      if (rich) return sRich ? s.html : H.fromText(s.text ?? "");
      return sRich ? H.toText(s.html) : s.text ?? "";
    };
    return { tree: T.parse(rich ? snippet.html : snippet.text ?? "", resolve), rich };
  }

  function output({ tree, rich }, values, ctx) {
    const rendered = T.render(tree, values, ctx, rich);
    if (!rich) return { ...T.splitCaret(rendered), html: null, marked: rendered, markedHtml: null };
    const plain = H.toText(rendered);
    return { ...T.splitCaret(plain), html: H.sanitize(rendered.replace(T.CARET, "")), marked: plain, markedHtml: H.sanitize(rendered) };
  }

  async function expand(target, snippet, typed) {
    busy = true;
    holding = true;
    held = "";
    try {
      const prepared = prepare(snippet);
      const ctx = {
        now: new Date(),
        siteTitle: document.title,
        siteUrl: location.href,
        siteDomain: location.hostname,
        siteSelection: String(window.getSelection?.() ?? ""),
      };
      if (hasCommand(prepared.tree, "clipboard")) ctx.clipboard = await readClipboard();
      const fields = T.fields(prepared.tree, ctx.now, ctx);
      applyPatientDefaults(fields);
      let values = {};
      if (fields.length) {
        holding = false;
        const saved = saveCaret(target);
        values = await askForm(snippet, prepared, fields, ctx);
        restoreCaret(target, saved);
        if (!values) {
          if (target.kind === "field") target.el.setSelectionRange(target.end, target.end);
          return;
        }
        holding = true;
        if (target.kind === "editable") {
          await new Promise((r) => setTimeout(r, 60));
          restoreCaret(target, saved);
        }
      }
      const out = output(prepared, values, ctx);
      if (ctx.actions && ctx.actions.length) {
        await runSteps(target, typed, out, ctx.actions);
      } else {
        await put(target, typed, out);
      }
      bumpUse(snippet.id);
    } finally {
      holding = false;
      busy = false;
      const late = held;
      held = "";
      if (late) replay(target, late);
    }
  }

  async function runSteps(initialTarget, typed, out, actions) {
    const segments = out.text.split(T.ACTION);
    const firstText = segments[0] ?? "";
    await put(initialTarget, typed, { text: firstText, back: 0, html: null, marked: firstText, markedHtml: null });

    for (let i = 0; i < actions.length; i++) {
      const act = actions[i];
      if (act.type === "wait") {
        const ms = Math.max(20, Math.min(10000, (act.seconds || 0.5) * 1000));
        await new Promise((r) => setTimeout(r, ms));
      } else if (act.type === "key") {
        await triggerKeyStep(act.key);
      }
      const nextSeg = segments[i + 1] ?? "";
      if (nextSeg) {
        await new Promise((r) => setTimeout(r, 20));
        const cur = currentTarget();
        if (cur) {
          if (cur.kind === "field") {
            cur.start = cur.el.selectionStart ?? cur.el.value.length;
            cur.end = cur.el.selectionEnd ?? cur.el.value.length;
          }
          await put(cur, "", { text: nextSeg, back: 0, html: null, marked: nextSeg, markedHtml: null });
        }
      }
    }
  }

  async function triggerKeyStep(rawKey) {
    const k = String(rawKey || "tab").toLowerCase().trim();
    const shiftKey = k.startsWith("shift+");
    const base = shiftKey ? k.slice(6) : k;
    const map = {
      tab: { key: "Tab", keyCode: 9 },
      enter: { key: "Enter", keyCode: 13 },
      return: { key: "Enter", keyCode: 13 },
      esc: { key: "Escape", keyCode: 27 },
      escape: { key: "Escape", keyCode: 27 },
      space: { key: " ", keyCode: 32 },
      up: { key: "ArrowUp", keyCode: 38 },
      down: { key: "ArrowDown", keyCode: 40 },
      left: { key: "ArrowLeft", keyCode: 37 },
      right: { key: "ArrowRight", keyCode: 39 },
      backspace: { key: "Backspace", keyCode: 8 },
    };
    const info = map[base] || { key: base, keyCode: base.toUpperCase().charCodeAt(0) || 0 };
    const beforeEl = deepActive();
    const taken = askPage("typefill-key-one", JSON.stringify({ ...info, shiftKey }));

    if (info.key === "Tab" && !taken && deepActive() === beforeEl) {
      moveFocusByTab(shiftKey);
    } else if (info.key === "Enter" && !taken && beforeEl) {
      const form = beforeEl.closest?.("form");
      if (form) {
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    }
    await new Promise((r) => setTimeout(r, 30));
  }

  function moveFocusByTab(reverse = false) {
    const focusables = [...document.querySelectorAll(
      'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'
    )].filter((el) => el.offsetParent !== null || el === document.activeElement);
    const idx = focusables.indexOf(deepActive());
    if (idx >= 0) {
      const nextIdx = reverse ? idx - 1 : idx + 1;
      if (focusables[nextIdx]) {
        focusables[nextIdx].focus();
        if (isTextField(focusables[nextIdx])) {
          try { focusables[nextIdx].select(); } catch { /* ignore */ }
        }
      }
    }
  }

  async function put(target, typed, out) {
    if (target.kind === "field") replaceInField(target, out);
    else if (target.kind === "editable") await replaceInEditable(target, typed, out);
    else if (target.replace) await target.replace(typed.length, out);
  }

  function replay(target, text) {
    if (target.kind === "field") document.execCommand("insertText", false, text);
    else if (target.kind === "editable") insertText(text);
    else paste(text);
    if (target.kind !== "docs") setTimeout(() => onInput({}), 0);
  }

  function hasCommand(nodes, type) {
    return nodes.some((n) => n.type === type || T.childLists(n).some((list) => hasCommand(list, type)));
  }

  function saveCaret(target) {
    if (target.kind !== "editable") return null;
    const sel = selectionFor(target.el);
    return sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
  }

  function restoreCaret(target, range) {
    target.el?.focus({ preventScroll: true });
    if (target.kind === "field") target.el.setSelectionRange(target.start, target.end);
    else if (target.kind === "editable" && range) {
      const sel = selectionFor(target.el);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (target.refocus) target.refocus();
  }

  function replaceInField({ el, start, end }, { text, back }) {
    el.setSelectionRange(start, end);
    if (!document.execCommand("insertText", false, text)) {
      el.setRangeText(text, start, end, "end");
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    }
    if (back) {
      const pos = el.selectionEnd - back;
      el.setSelectionRange(pos, pos);
    }
  }

  async function selectionTold() {
    document.dispatchEvent(new Event("selectionchange"));
    await new Promise((r) => setTimeout(r, 30));
  }

  async function replaceInEditable({ el }, typed, out) {
    const { text, back, html } = out;
    const sel = selectionFor(el);
    if (typed) {
      for (let i = 0; i < typed.length; i++) sel.modify("extend", "backward", "character");
      if (sel.toString().replace(/\u00a0/g, " ") !== typed.replace(/\u00a0/g, " ")) { sel.collapseToEnd(); return; }
      await selectionTold();
      deleteSelection();
      await selectionTold();
      if (squash(textBeforeCaret(selectionFor(el), el, typed.length + 20)).endsWith(squash(typed))) return;
    }
    const marked = back > 0;
    const t = marked ? out.marked : text;
    const h = marked ? out.markedHtml : html;
    const done = h
      ? paste(t, h) || document.execCommand("insertHTML", false, h)
      : t.includes("\n") ? paste(t) || document.execCommand("insertText", false, t) : insertText(t);
    if (!done || !marked) return;
    await settled(el, t.replace(T.CARET, ""));
    if (await takeMark(el)) return;
    caretBack(el, text, back);
    document.dispatchEvent(new Event("selectionchange"));
  }

  async function takeMark(el) {
    const find = () => {
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const at = n.data.indexOf(T.CARET);
        if (at >= 0) return { node: n, at };
      }
      return null;
    };
    for (let tries = 0; tries < 3; tries++) {
      const hit = find();
      if (!hit) return tries > 0;
      const r = document.createRange();
      r.setStart(hit.node, hit.at);
      r.setEnd(hit.node, hit.at + 1);
      const sel = selectionFor(el);
      sel.removeAllRanges();
      sel.addRange(r);
      await selectionTold();
      deleteSelection();
      await selectionTold();
    }
    return !find();
  }

  function askPage(name, detail) {
    const root = document.documentElement;
    root.removeAttribute("data-typefill-pasted");
    window.dispatchEvent(new CustomEvent(name, { detail }));
    const taken = root.getAttribute("data-typefill-pasted") === "1";
    root.removeAttribute("data-typefill-pasted");
    return taken;
  }

  function insertText(text) {
    return askPage("typefill-insert", text) || document.execCommand("insertText", false, text);
  }

  function deleteSelection() {
    return askPage("typefill-delete", "") || document.execCommand("delete");
  }

  function paste(text, html = null) {
    const root = document.documentElement;
    root.removeAttribute("data-typefill-pasted");
    window.dispatchEvent(new CustomEvent("typefill-paste", { detail: JSON.stringify({ text, html }) }));
    const taken = root.getAttribute("data-typefill-pasted") === "1";
    root.removeAttribute("data-typefill-pasted");
    return taken;
  }

  async function readClipboard() {
    try { return await navigator.clipboard.readText(); } catch { /* fallback */ }
    const active = document.activeElement;
    const box = document.createElement("textarea");
    box.style.cssText = "position: fixed; top: -100px; opacity: 0;";
    document.documentElement.append(box);
    box.focus();
    let text = "";
    try { if (document.execCommand("paste")) text = box.value; } catch { /* nothing */ }
    box.remove();
    if (active instanceof HTMLElement) active.focus({ preventScroll: true });
    return text;
  }

  function bumpUse(id) {
    if (rawApi?.runtime?.sendMessage) {
      rawApi.runtime.sendMessage({ type: "used", id }).catch(() => {});
    } else if (id) {
      storageLocal.get("uses").then(({ uses = {} }) => {
        uses[id] = { n: (uses[id]?.n ?? 0) + 1, last: Date.now() };
        storageLocal.set({ uses });
      }).catch(() => {});
    }
  }

  // ---- Google Docs ----

  function watchDocs() {
    let typed = "";
    document.addEventListener("keydown", (e) => {
      if (!enabled || busy || !snippets.length) return;
      if (e.ctrlKey || e.metaKey || e.altKey) { typed = ""; return; }
      if (e.key === "Backspace") { typed = typed.slice(0, -1); return; }
      if (e.key.length !== 1) { if (e.key !== "Shift") typed = ""; return; }
      typed = (typed + e.key).slice(-Math.max(longest, 1) * 2);
      const s = match(typed);
      if (!s) return;
      typed = "";
      setTimeout(() => void expand(docsTarget(), s, s.shortcut), 30);
    }, true);
    document.addEventListener("mousedown", () => { typed = ""; }, true);
    window.top.document.addEventListener("mousedown", () => { typed = ""; }, true);
  }

  function docsTarget() {
    const editable = document.activeElement?.isContentEditable ? document.activeElement : document.querySelector("[contenteditable=true]") ?? document.body;
    return {
      kind: "docs",
      refocus: () => editable.focus(),
      replace: async (length, { text, back, html }) => {
        editable.focus();
        for (let i = 0; i < length; i++) docsKey("Backspace", 8);
        paste(text, html);
        if (!back) return;
        await new Promise((r) => setTimeout(r, 150));
        for (let i = 0; i < back; i++) docsKey("ArrowLeft", 37);
      },
    };
  }

  function docsKey(key, keyCode) {
    window.dispatchEvent(new CustomEvent("typefill-key", { detail: JSON.stringify({ key, keyCode }) }));
  }

  // ---- Modais sobre a página ("Clínica Serena") ----

  function overlay(css, html) {
    const doc = (() => { try { return window.top.document; } catch { return document; } })();
    const host = doc.createElement("typefill-box");
    host.style.cssText = "all: initial; position: fixed; inset: 0; z-index: 2147483647;";
    const isDark = doc.documentElement.dataset?.theme === "dark"
      || (!doc.documentElement.dataset?.theme && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `<style>${BASE_CSS}${css}</style><dialog class="layer${isDark ? " dark" : ""}"><div class="back"></div>${html}</dialog>`;
    doc.documentElement.append(host);
    const layer = shadow.querySelector(".layer");
    layer.addEventListener("cancel", (e) => e.preventDefault());
    try { layer.showModal(); } catch { layer.setAttribute("open", ""); }
    return { doc, host, shadow };
  }

  function keysTo(doc, handler) {
    if (doc === document) globalThis.__typefillKey = handler;
  }

  function askForm(snippet, prepared, fields, ctx, problems = []) {
    return new Promise((resolve) => {
      const { doc, host, shadow } = overlay("", `
        <form class="box" role="dialog" aria-label="Preencher dados do atalho">
          <div class="head">
            <div class="title-wrap"><span class="code-badge"></span><strong></strong></div>
            <span class="hint"><kbd>Enter</kbd> inserir · <kbd>Esc</kbd> cancelar</span>
          </div>
          <div class="problems"></div>
          <div class="fields"></div>
          <details class="preview-wrap" open>
            <summary>Pré-visualização do texto</summary>
            <div class="preview" aria-label="Pré-visualização"></div>
          </details>
          <div class="buttons"><button type="button" class="cancel">Cancelar</button><button type="submit" class="ok">Inserir texto</button></div>
        </form>`);
      shadow.querySelector("strong").textContent = snippet.label || "Atalho";
      const badge = shadow.querySelector(".code-badge");
      if (snippet.shortcut) badge.textContent = snippet.shortcut;
      else badge.remove();

      const box = shadow.querySelector(".fields");
      const preview = shadow.querySelector(".preview");
      const values = {};
      const inputs = [];
      for (const f of fields) {
        const row = doc.createElement("label");
        const isWide = f.kind === "formparagraph" || f.kind === "formtoggle" || (f.kind === "formmenu" && (f.options ?? []).some((o) => o.length > 36));
        row.className = `row${isWide ? " full" : ""}`;
        const name = doc.createElement("span");
        name.textContent = f.name;
        let input;
        if (f.kind === "formparagraph") { input = doc.createElement("textarea"); input.rows = 3; input.value = f.default; }
        else if (f.kind === "formmenu") {
          input = doc.createElement("select");
          for (const o of f.options) { const opt = doc.createElement("option"); opt.value = o; opt.textContent = o; input.append(opt); }
          input.value = f.default;
        } else if (f.kind === "formtoggle") { input = doc.createElement("input"); input.type = "checkbox"; input.checked = f.default; row.classList.add("check"); }
        else if (f.kind === "formdate") { input = doc.createElement("input"); input.type = "date"; input.value = f.default; }
        else { input = doc.createElement("input"); input.type = "text"; input.value = f.default; }
        const read = () => { values[f.name] = f.kind === "formtoggle" ? input.checked : input.value; };
        read();
        input.addEventListener("input", () => { read(); show(); });
        input.addEventListener("change", () => { read(); show(); });
        if (f.kind === "formtoggle") row.append(input, name); else row.append(name, input);
        box.append(row);
        inputs.push(input);
      }
      for (const p of problems) {
        const line = doc.createElement("p");
        line.className = "problem";
        line.textContent = p;
        shadow.querySelector(".problems").append(line);
      }
      const show = () => {
        const parts = output(prepared, values, ctx).text.split(T.ACTION);
        preview.textContent = parts.map((p, i) => (i ? `[${ctx.actions[i - 1]?.type === "wait" ? "pausa" : ctx.actions[i - 1]?.key}]` : "") + p).join("");
      };
      show();

      let finished = false;
      const done = (result) => {
        if (finished) return;
        finished = true;
        globalThis.__typefillKey = null;
        host.remove();
        resolve(result);
      };
      const form = shadow.querySelector("form");
      form.addEventListener("submit", (e) => { e.preventDefault(); done({ ...values }); });
      const onKey = (e) => {
        e.stopPropagation();
        const at = shadow.activeElement;
        if (e.key === "Escape") { e.preventDefault(); done(null); return; }
        if (e.key !== "Enter" || at instanceof HTMLButtonElement) return;
        if (at instanceof HTMLTextAreaElement && !(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        done({ ...values });
      };
      form.addEventListener("keydown", onKey);
      keysTo(doc, onKey);
      shadow.querySelector(".cancel").addEventListener("click", () => done(null));
      shadow.querySelector(".back").addEventListener("mousedown", () => done(null));
      (inputs[0] ?? shadow.querySelector(".ok")).focus();
      inputs[0]?.select?.();
    });
  }

  async function openSearch(target) {
    const saved = saveCaret(target);
    busy = true;
    const chosen = await new Promise((resolve) => {
      const { doc, host, shadow } = overlay(SEARCH_CSS, `
        <div class="box" role="dialog" aria-label="Buscar atalho">
          <input class="q" type="search" placeholder="Buscar atalho por código, nome ou especialidade…" aria-label="Buscar atalho" autocomplete="off">
          <ul class="results" role="listbox"></ul>
          <div class="hint"><kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Enter</kbd> inserir · <kbd>Esc</kbd> fechar</div>
        </div>`);
      const q = shadow.querySelector(".q");
      const results = shadow.querySelector(".results");
      let shown = [], at = 0;
      const draw = () => {
        const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const hay = (s) => [s.shortcut, s.label, s.folder, s.rich ? H.toText(s.html ?? "") : s.text].join(" ").toLowerCase();
        shown = all.filter((s) => !s.off && words.every((w) => hay(s).includes(w))).slice(0, 10);
        at = Math.min(at, Math.max(0, shown.length - 1));
        results.textContent = "";
        shown.forEach((s, i) => {
          const li = doc.createElement("li");
          li.setAttribute("role", "option");
          li.setAttribute("aria-selected", String(i === at));
          const top = doc.createElement("div");
          const name = doc.createElement("strong");
          name.textContent = s.label || s.shortcut || "Atalho";
          const key = doc.createElement("code");
          key.textContent = s.shortcut ?? "";
          top.append(name, key);
          const what = doc.createElement("div");
          what.className = "what";
          what.textContent = `${s.folder ? `[${s.folder}] ` : ""}${(s.rich ? H.toText(s.html ?? "") : s.text ?? "").replace(/\s+/g, " ").slice(0, 95)}`;
          li.append(top, what);
          li.addEventListener("mousedown", (e) => { e.preventDefault(); done(s); });
          results.append(li);
        });
        if (!shown.length) {
          const li = doc.createElement("li");
          li.className = "none";
          li.textContent = all.length ? "Nenhum atalho encontrado." : "Nenhum atalho cadastrado.";
          results.append(li);
        }
      };
      let finished = false;
      const done = (result) => {
        if (finished) return;
        finished = true;
        globalThis.__typefillKey = null;
        host.remove();
        resolve(result);
      };
      q.addEventListener("input", () => { at = 0; draw(); });
      const onKey = (e) => {
        e.stopPropagation();
        if (e.key === "Escape") { e.preventDefault(); done(null); }
        else if (e.key === "ArrowDown") { e.preventDefault(); at = Math.min(at + 1, shown.length - 1); draw(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); at = Math.max(at - 1, 0); draw(); }
        else if (e.key === "Enter") { e.preventDefault(); if (shown[at]) done(shown[at]); }
      };
      shadow.querySelector(".box").addEventListener("keydown", onKey);
      keysTo(doc, onKey);
      shadow.querySelector(".back").addEventListener("mousedown", () => done(null));
      draw();
      q.focus();
    });
    busy = false;
    restoreCaret(target, saved);
    if (chosen) await expand(target, chosen, "");
  }

  const BASE_CSS = `
    :host { all: initial; }
    .layer { position: fixed; inset: 0; width: 100vw; height: 100vh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: transparent; overflow: hidden;
      --bg: #FFFFFF; --bg-2: #F0F3F6; --ink: #1B2430; --ink-2: #5B6675; --line: #CBD2DC; --primary: #1F6F78; --primary-soft: #E6F1F2; }
    .layer.dark {
      --bg: #1A2129; --bg-2: #222B35; --ink: #E6EAEF; --ink-2: #9AA5B1; --line: #3A4654; --primary: #4FA3AC; --primary-soft: #173A3F; color-scheme: dark; }
    .layer::backdrop { background: transparent; }
    .back { position: fixed; inset: 0; background: rgba(15, 23, 42, .42); backdrop-filter: blur(2px); }
    .box { position: fixed; top: 7vh; left: 50%; transform: translateX(-50%); width: min(560px, calc(100vw - 32px));
      max-height: 86vh; overflow: auto; box-sizing: border-box; padding: 20px; border-radius: 13px;
      background: var(--bg); color: var(--ink); border: 1px solid var(--line); box-shadow: 0 20px 56px rgba(0,0,0,.28);
      font: 14px/1.5 "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, sans-serif; }
    .head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; border-bottom: 1px solid var(--line); padding-bottom: 10px; }
    .title-wrap { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .code-badge { font: 600 12px ui-monospace, Consolas, monospace; color: var(--primary); background: var(--primary-soft); padding: 2px 7px; border-radius: 5px; }
    .head strong { font-size: 15px; font-weight: 650; }
    .hint { color: var(--ink-2); font-size: 12px; white-space: nowrap; }
    kbd { font: 11px ui-monospace, Consolas, monospace; padding: 1px 5px; border-radius: 4px; border: 1px solid var(--line); background: var(--bg-2); }
    .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .row { display: grid; gap: 4px; font-weight: 550; font-size: 12.5px; min-width: 0; }
    .row > span { color: var(--ink-2); }
    .row.full { grid-column: 1 / -1; }
    .row.check { display: flex; align-items: center; gap: 8px; padding-top: 2px; }
    .row.check > span { color: var(--ink); font-size: 13px; }
    input[type=text], input[type=date], input[type=search], textarea, select { font: 13.5px/1.4 inherit; width: 100%; max-width: 100%; box-sizing: border-box; padding: 7px 10px; border: 1px solid var(--line); border-radius: 7px; background: var(--bg); color: var(--ink); }
    input:focus, textarea:focus, select:focus, button:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
    .preview-wrap { margin: 12px 0 14px; border-top: 1px solid var(--line); padding-top: 8px; }
    .preview-wrap > summary { font-size: 12px; font-weight: 600; color: var(--ink-2); cursor: pointer; margin-bottom: 6px; }
    .preview { white-space: pre-wrap; background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; max-height: 190px; overflow: auto; color: var(--ink); font-size: 12.5px; }
    .buttons { display: flex; justify-content: flex-end; gap: 8px; }
    button { font: inherit; font-size: 13px; font-weight: 550; padding: 7px 15px; border-radius: 7px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); cursor: pointer; }
    .ok { background: var(--primary); border-color: var(--primary); color: #fff; }
    .layer.dark .ok { color: #0C2225; font-weight: 650; }
    .problem { margin: 0 0 10px; padding: 8px 10px; border-radius: 7px; background: #FEF6E7; color: #B7791F; }`;

  const SEARCH_CSS = `
    .box { padding: 14px; }
    .q { width: 100%; box-sizing: border-box; font-size: 14.5px; padding: 9px 12px; }
    .results { list-style: none; margin: 10px 0; padding: 0; max-height: 55vh; overflow: auto; }
    .results li { padding: 9px 11px; border-radius: 8px; cursor: pointer; }
    .results li[aria-selected="true"] { background: var(--primary-soft); }
    .results li > div:first-child { display: flex; justify-content: space-between; gap: 10px; }
    .results code { font: 600 12px ui-monospace, Consolas, monospace; color: var(--primary); background: var(--bg-2); padding: 1px 6px; border-radius: 5px; }
    .results .what { color: var(--ink-2); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .results .none { color: var(--ink-2); cursor: default; }`;

  globalThis.__typefillCore = { put, currentTarget, askPage, docsKey, deepActive, inDocsFrame, openSearch };
})();
