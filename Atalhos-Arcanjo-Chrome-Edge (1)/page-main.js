// Executa no mundo principal (MAIN) da página para simular eventos ClipboardEvent e KeyboardEvent com keyCode nativo.

(() => {
  "use strict";
  if (window.__typefillPageMain) return;
  window.__typefillPageMain = true;

  window.addEventListener("typefill-paste", (e) => {
    let detail;
    try { detail = JSON.parse(e.detail); } catch { return; }
    const { text, html } = detail;
    const init = { bubbles: true, cancelable: true, composed: true };
    let ev;
    try {
      const data = new DataTransfer();
      data.setData("text/plain", text);
      if (html) data.setData("text/html", html);
      ev = new ClipboardEvent("paste", { ...init, clipboardData: data });
      if (ev.clipboardData?.getData("text/plain") !== text) throw new Error("no data");
    } catch {
      ev = new ClipboardEvent("paste", { ...init, dataType: html ? "text/html" : "text/plain", data: html ?? text });
      if (html) try { ev.clipboardData.setData("text/plain", text); } catch { /* html only */ }
    }
    deepActive().dispatchEvent(ev);
    document.documentElement.setAttribute("data-typefill-pasted", ev.defaultPrevented ? "1" : "0");
  });

  for (const [name, inputType] of [["typefill-insert", "insertText"], ["typefill-delete", "deleteContentBackward"]]) {
    window.addEventListener(name, (e) => {
      const sel = document.getSelection();
      let ev;
      try {
        ev = new InputEvent("beforeinput", { inputType, data: inputType === "insertText" ? e.detail : null, bubbles: true, cancelable: true, composed: true, targetRanges: sel.rangeCount ? [new StaticRange(sel.getRangeAt(0))] : [] });
      } catch { return; }
      deepActive().dispatchEvent(ev);
      document.documentElement.setAttribute("data-typefill-pasted", ev.defaultPrevented ? "1" : "0");
    });
  }

  window.addEventListener("typefill-key-one", (e) => {
    let detail;
    try { detail = JSON.parse(e.detail); } catch { return; }
    const target = deepActive();
    let taken = false;
    for (const type of ["keydown", "keypress", "keyup"]) {
      if (type === "keypress" && detail.key !== "Enter") continue;
      const ev = new KeyboardEvent(type, { key: detail.key, code: detail.key === " " ? "Space" : detail.key, shiftKey: !!detail.shiftKey, bubbles: true, cancelable: true, composed: true });
      Object.defineProperty(ev, "keyCode", { get: () => detail.keyCode });
      Object.defineProperty(ev, "which", { get: () => detail.keyCode });
      target.dispatchEvent(ev);
      if (type === "keydown") taken = ev.defaultPrevented;
    }
    document.documentElement.setAttribute("data-typefill-pasted", taken ? "1" : "0");
  });

  window.addEventListener("typefill-key", (e) => {
    let detail;
    try { detail = JSON.parse(e.detail); } catch { return; }
    const target = deepActive();
    for (const type of ["keydown", "keyup"]) {
      const ev = new KeyboardEvent(type, { key: detail.key, code: detail.key, bubbles: true, cancelable: true });
      Object.defineProperty(ev, "keyCode", { get: () => detail.keyCode });
      Object.defineProperty(ev, "which", { get: () => detail.keyCode });
      target.dispatchEvent(ev);
    }
  });

  function deepActive() {
    let el = document.activeElement ?? document.body;
    while (el.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    return el;
  }
})();
