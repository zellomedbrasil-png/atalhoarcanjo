// Executa antes dos scripts da página para evitar que atalhos de sites (como Gmail/WhatsApp) interceptem teclas
// destinadas aos modais abertos do Atalhos Arcanjo.

(() => {
  "use strict";
  if (globalThis.__typefillGuard) return;
  globalThis.__typefillGuard = true;

  for (const type of ["keydown", "keypress", "keyup"]) {
    window.addEventListener(type, (e) => {
      const hook = globalThis.__typefillKey;
      if (!hook || !(e.target instanceof Element) || e.target.localName !== "typefill-box") return;
      if (type === "keydown") hook(e);
      e.stopImmediatePropagation();
    }, true);
  }
})();
