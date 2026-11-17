// Motor de Templates do Atalhos Arcanjo — 100% Liberado (inclui todos os recursos Pro nativamente)
// Comandos suportados:
//   {time: DD/MM/YYYY; shift=+7D}   {clipboard}   {cursor}
//   {formtext: name=Paciente; default=...}   {formparagraph: name=Observações}
//   {formmenu: name=Conduta; default=Opção 1; Opção 2}   {formtoggle: name=Incluir}...{endformtoggle}
//   {formdate: name=Retorno; format=DD/MM/YYYY; default=+30D}
//   {=Paciente} repete o valor do campo.
//   {=imc(Peso, Altura)}, {=cockcroft(Idade, Peso, Creatinina, Sexo)}, {=fib4(Idade, AST, ALT, Plaquetas)} e fórmulas matemáticas!
//   {if: Sexo = 'Feminino'}...{elseif: ...}...{else}...{endif}
//   {site: selection}, {site: title}, {site: url}, {site: text; selector=#id}
//   {key: tab}, {key: enter}, {wait: 0.5}
//   {import: /assinatura} inclui outro atalho dentro deste.
//   {note}...{endnote} exibe campos no formulário mas não digita o conteúdo no texto final.

(function (root) {
  "use strict";

  const FIELDS = new Set(["formtext", "formparagraph", "formmenu", "formtoggle", "formdate"]);
  const CARET = String.fromCharCode(0xe000);
  const ACTION = String.fromCharCode(0xe001);
  const ADVANCED_TYPES = new Set(["if", "expr", "site", "lookup", "key", "wait"]);

  const hooks = { renderers: {}, menuOptions: null };
  function extend(plugin) {
    Object.assign(hooks.renderers, plugin.renderers ?? {});
    if (plugin.menuOptions) hooks.menuOptions = plugin.menuOptions;
  }

  function parseArgs(src) {
    const parts = [];
    let cur = "";
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch === "\\" && i + 1 < src.length) { cur += src[++i]; continue; }
      if (ch === ";") { parts.push(cur); cur = ""; continue; }
      cur += ch;
    }
    parts.push(cur);
    const named = {}, plain = [];
    for (const raw of parts) {
      const p = raw.trim();
      if (!p) continue;
      const m = /^([a-zA-ZÀ-ÿ_][a-zA-ZÀ-ÿ0-9_]*)\s*=\s*([\s\S]*)$/.exec(p);
      if (m) named[m[1].toLowerCase()] = m[2].trim();
      else plain.push(p);
    }
    return { named, plain };
  }

  function parse(text, resolve, depth = 0) {
    const top = [];
    const frames = [{ list: top, owner: null }];
    const stack = { push: (list, owner) => frames.push({ list, owner }), top: () => frames[frames.length - 1] };
    const into = () => stack.top().list;
    let buf = "";
    const flush = () => { if (buf) { into().push({ type: "text", value: buf }); buf = ""; } };
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === "\\" && (text[i + 1] === "{" || text[i + 1] === "}" || text[i + 1] === "\\")) { buf += text[++i]; continue; }
      if (ch !== "{") { buf += ch; continue; }
      let j = i + 1, inner = "";
      for (; j < text.length; j++) {
        if (text[j] === "\\" && j + 1 < text.length) { inner += text[j] + text[j + 1]; j++; continue; }
        if (text[j] === "}") break;
        inner += text[j];
      }
      if (j >= text.length) { buf += text.slice(i); break; }
      i = j;
      const m = /^\s*(=|[a-zA-Z]+)\s*:?\s*([\s\S]*)$/.exec(inner);
      if (!m) { buf += "{" + inner + "}"; continue; }
      const cmd = m[1].toLowerCase();
      flush();
      const owner = stack.top().owner;
      if (cmd === "=") {
        into().push({ type: "expr", src: m[2].trim() });
      } else if (cmd === "endformtoggle") {
        if (owner?.type === "formtoggle") frames.pop();
      } else if (cmd === "endnote") {
        if (owner?.type === "note") frames.pop();
      } else if (cmd === "if" || cmd === "se") {
        const node = { type: "if", branches: [{ cond: m[2].trim(), children: [] }], otherwise: null };
        into().push(node);
        stack.push(node.branches[0].children, node);
      } else if ((cmd === "elseif" || cmd === "senao_se" || cmd === "senaose") && owner?.type === "if" && !owner.otherwise) {
        const branch = { cond: m[2].trim(), children: [] };
        owner.branches.push(branch);
        frames.pop();
        stack.push(branch.children, owner);
      } else if ((cmd === "else" || cmd === "senao") && owner?.type === "if" && !owner.otherwise) {
        owner.otherwise = [];
        frames.pop();
        stack.push(owner.otherwise, owner);
      } else if (cmd === "endif" || cmd === "fimse") {
        if (owner?.type === "if") frames.pop();
      } else if (cmd === "import" || cmd === "importar") {
        const source = depth < 5 && resolve ? resolve(parseArgs(m[2]).plain[0] ?? "") : null;
        if (source != null) into().push(...parse(source, resolve, depth + 1));
      } else {
        const node = { type: cmd, ...parseArgs(m[2]) };
        into().push(node);
        if (cmd === "formtoggle" || cmd === "note") { node.children = []; stack.push(node.children, node); }
      }
    }
    flush();
    return top;
  }

  function childLists(node) {
    if (node.children) return [node.children];
    if (node.type === "if") return [...node.branches.map((b) => b.children), ...(node.otherwise ? [node.otherwise] : [])];
    return [];
  }

  // No Atalhos Arcanjo, todos os recursos Pro estão 100% liberados!
  // proParts retorna sempre [] para nunca bloquear nenhum atalho, e advancedParts lista os recursos avançados ativos.
  function proParts() {
    return [];
  }

  function advancedParts(tree, fieldNames = new Set(fields(tree).map((f) => f.name.toLowerCase()))) {
    const found = new Set();
    const walk = (nodes) => {
      for (const node of nodes) {
        if (node.type === "if") found.add("condicionais (se/senão)");
        if (node.type === "expr" && !fieldNames.has(node.src.toLowerCase())) found.add("fórmulas e calculadoras");
        if (node.type === "site") found.add("dados da página");
        if (node.type === "lookup" || (node.type === "formmenu" && node.named?.sheet)) found.add("dados de tabela");
        if (node.type === "key" || node.type === "wait") found.add("automação de teclas");
        childLists(node).forEach(walk);
      }
    };
    walk(tree);
    return [...found];
  }

  function fields(tree, now = new Date(), ctx = {}) {
    const out = [], seen = new Set();
    let n = 0;
    const walk = (nodes) => {
      for (const node of nodes) {
        if (FIELDS.has(node.type)) {
          if (!node.named.name) node.named.name = `${labelFor(node.type)}${++n > 1 ? " " + n : ""}`;
          const name = node.named.name;
          if (!seen.has(name)) {
            seen.add(name);
            const field = { kind: node.type, name, default: node.named.default ?? "" };
            if (node.type === "formmenu") {
              const extra = hooks.menuOptions ? hooks.menuOptions(node, ctx) : [];
              field.options = [...new Set([...(node.named.default !== undefined ? [node.named.default] : []), ...node.plain, ...extra])];
              if (!field.default) field.default = field.options[0] ?? "";
            }
            if (node.type === "formtoggle") field.default = !/^(no|false|off|0|nao|não)$/i.test(node.named.default ?? "yes");
            if (node.type === "formdate") field.default = dateDefault(node.named.default, now);
            out.push(field);
          }
        }
        childLists(node).forEach(walk);
      }
    };
    walk(tree);
    return out;
  }

  function labelFor(kind) {
    return { formtext: "Texto", formparagraph: "Parágrafo", formmenu: "Opção", formtoggle: "Incluir", formdate: "Data" }[kind];
  }

  function dateDefault(def, now) {
    if (def && /^\d{4}-\d{2}-\d{2}$/.test(def)) return def;
    return formatDate(shiftDate(now, def || ""), "YYYY-MM-DD");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]).replace(/\n/g, "<br>");
  }

  // ---- Motor Nativo de Expressões, Condicionais e Calculadoras Médicas ----

  function toNum(v) {
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (v == null) return 0;
    const clean = String(v).trim().replace(",", ".");
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }

  function calcImcValue(peso, altura) {
    const p = toNum(peso);
    let h = toNum(altura);
    if (p <= 0 || h <= 0) return 0;
    if (h > 3) h = h / 100; // Converte cm (ex: 170) para metros (1.70) automaticamente
    return p / (h * h);
  }

  function calcClassImc(peso, altura, idade = 40) {
    const val = calcImcValue(peso, altura);
    if (!val) return "Preencha peso e altura";
    const id = toNum(idade);
    if (id >= 60) {
      if (val <= 22) return "Baixo peso para idoso (≤ 22 kg/m²)";
      if (val < 27) return "Eutrofia para idoso (22 a 27 kg/m²)";
      return "Excesso de peso para idoso (≥ 27 kg/m²)";
    }
    if (val < 18.5) return "Baixo peso (< 18,5 kg/m²)";
    if (val < 25) return "Eutrofia (18,5 a 24,9 kg/m²)";
    if (val < 30) return "Sobrepeso (25 a 29,9 kg/m²)";
    if (val < 35) return "Obesidade Grau I (30 a 34,9 kg/m²)";
    if (val < 40) return "Obesidade Grau II (35 a 39,9 kg/m²)";
    return "Obesidade Grau III (≥ 40 kg/m²)";
  }

  function calcCockcroft(idade, peso, creatinina, sexo = "Masculino") {
    const id = toNum(idade);
    const p = toNum(peso);
    const cr = toNum(creatinina);
    if (id <= 0 || p <= 0 || cr <= 0) return 0;
    let cl = ((140 - id) * p) / (72 * cr);
    if (/^(f|mulher|feminino)/i.test(String(sexo).trim())) cl *= 0.85;
    return cl;
  }

  function calcEstagioDrc(clcr) {
    const v = toNum(clcr);
    if (v <= 0) return "Preencha os dados";
    if (v >= 90) return "G1 (≥ 90 mL/min — Normal ou elevado)";
    if (v >= 60) return "G2 (60–89 mL/min — Redução discreta)";
    if (v >= 45) return "G3a (45–59 mL/min — Redução discreta a moderada)";
    if (v >= 30) return "G3b (30–44 mL/min — Redução moderada a grave)";
    if (v >= 15) return "G4 (15–29 mL/min — Redução grave; atenção ao ajuste de doses)";
    return "G5 (< 15 mL/min — Falência renal)";
  }

  function calcFib4Value(idade, ast, alt, plaquetas) {
    const id = toNum(idade);
    const tgo = toNum(ast);
    const tgp = toNum(alt);
    let plq = toNum(plaquetas);
    if (id <= 0 || tgo <= 0 || tgp <= 0 || plq <= 0) return 0;
    // Se o médico digitar 150000 (por mm³) ou 150.000, ajusta para 150 (10^9/L)
    if (plq > 1000) plq = plq / 1000;
    return (id * tgo) / (plq * Math.sqrt(tgp));
  }

  function calcRiscoFib4(idade, ast, alt, plaquetas) {
    const score = calcFib4Value(idade, ast, alt, plaquetas);
    if (!score) return "Preencha idade, AST, ALT e plaquetas";
    const id = toNum(idade);
    const lowCut = id >= 65 ? 2.0 : 1.3;
    if (score < lowCut) return `Baixo risco de fibrose avançada F3-F4 (corte < ${lowCut.toFixed(2)})`;
    if (score > 2.67) return "Alto risco de fibrose avançada F3-F4 (> 2.67 — indicar Elastografia / Hepatologia)";
    return "Risco intermediário/indeterminado (considerar Elastografia Hepática)";
  }

  function calcMeldValue(bilirrubina, inr, creatinina, sodio = 137) {
    const bili = Math.max(1, toNum(bilirrubina));
    const inrVal = Math.max(1, toNum(inr));
    const cr = Math.min(4, Math.max(1, toNum(creatinina)));
    const na = Math.min(137, Math.max(125, toNum(sodio) || 137));
    if (!toNum(bilirrubina) || !toNum(inr) || !toNum(creatinina)) return 0;
    const meldI = 0.957 * Math.log(cr) + 0.378 * Math.log(bili) + 1.120 * Math.log(inr) + 0.643;
    const meld = Math.round(meldI * 10);
    if (meld > 11) {
      const meldNa = meld + 1.32 * (137 - na) - (0.033 * meld * (137 - na));
      return Math.round(meldNa);
    }
    return meld;
  }

  const BUILTIN_FUNCS = {
    fixed: (n, d = 2) => toNum(n).toFixed(Math.max(0, Math.min(10, toNum(d)))),
    round: (n, d = 0) => {
      const f = Math.pow(10, toNum(d));
      return Math.round(toNum(n) * f) / f;
    },
    floor: (n) => Math.floor(toNum(n)),
    ceil: (n) => Math.ceil(toNum(n)),
    abs: (n) => Math.abs(toNum(n)),
    sqrt: (n) => Math.sqrt(Math.max(0, toNum(n))),
    pow: (a, b) => Math.pow(toNum(a), toNum(b)),
    min: (...args) => Math.min(...args.map(toNum)),
    max: (...args) => Math.max(...args.map(toNum)),
    upper: (s) => String(s ?? "").toUpperCase(),
    lower: (s) => String(s ?? "").toLowerCase(),
    trim: (s) => String(s ?? "").trim(),
    len: (s) => String(s ?? "").length,
    imc: (peso, altura) => {
      const v = calcImcValue(peso, altura);
      return v ? v.toFixed(1) : "0.0";
    },
    classimc: (peso, altura, idade = 40) => calcClassImc(peso, altura, idade),
    class_imc: (peso, altura, idade = 40) => calcClassImc(peso, altura, idade),
    cockcroft: (idade, peso, creatinina, sexo = "M") => {
      const v = calcCockcroft(idade, peso, creatinina, sexo);
      return v ? v.toFixed(1) : "0.0";
    },
    clcr: (idade, peso, creatinina, sexo = "M") => {
      const v = calcCockcroft(idade, peso, creatinina, sexo);
      return v ? v.toFixed(1) : "0.0";
    },
    estagiodrc: (clcr) => calcEstagioDrc(clcr),
    estagio_drc: (clcr) => calcEstagioDrc(clcr),
    fib4: (idade, ast, alt, plaquetas) => {
      const v = calcFib4Value(idade, ast, alt, plaquetas);
      return v ? v.toFixed(2) : "0.00";
    },
    riscofib4: (idade, ast, alt, plaquetas) => calcRiscoFib4(idade, ast, alt, plaquetas),
    risco_fib4: (idade, ast, alt, plaquetas) => calcRiscoFib4(idade, ast, alt, plaquetas),
    meld: (bili, inr, cr, na = 137) => calcMeldValue(bili, inr, cr, na),
    pesoideal: (altura, sexo = "M") => {
      let h = toNum(altura);
      if (h <= 0) return "0.0";
      if (h > 3) h = h / 100;
      const targetImc = /^(f|mulher|feminino)/i.test(String(sexo).trim()) ? 21.5 : 22.5;
      return (targetImc * h * h).toFixed(1);
    },
    dosekg: (peso, mgKg, maxMg = 999999) => {
      const d = Math.min(toNum(peso) * toNum(mgKg), toNum(maxMg));
      return d ? Math.round(d * 10) / 10 : 0;
    }
  };

  // Avaliador seguro de expressões (sem eval/new Function, compatível com CSP de extensões MV3!)
  function evalExpr(src, values = {}) {
    if (!src || !String(src).trim()) return "";
    const trimmed = String(src).trim();
    // 1. Verifica correspondência direta com o nome de um campo
    const exactKey = Object.keys(values).find((k) => k.toLowerCase() === trimmed.toLowerCase());
    if (exactKey !== undefined) return values[exactKey] ?? "";

    // 2. Tokeniza a expressão reconhecendo nomes de campos com espaços
    const fieldKeys = Object.keys(values).sort((a, b) => b.length - a.length);
    const tokens = [];
    let i = 0;
    while (i < trimmed.length) {
      const rest = trimmed.slice(i);
      const ws = /^\s+/.exec(rest);
      if (ws) { i += ws[0].length; continue; }

      // String literal '...' ou "..."
      if (rest[0] === "'" || rest[0] === '"') {
        const q = rest[0];
        let j = 1, s = "";
        while (j < rest.length && rest[j] !== q) {
          if (rest[j] === "\\" && j + 1 < rest.length) { s += rest[j + 1]; j += 2; }
          else { s += rest[j]; j++; }
        }
        tokens.push({ type: "val", value: s });
        i += j + 1;
        continue;
      }

      // Número literal
      const numMatch = /^\d+(?:\.\d+)?/.exec(rest);
      if (numMatch) {
        tokens.push({ type: "val", value: Number(numMatch[0]) });
        i += numMatch[0].length;
        continue;
      }

      // Verifica se começa com o nome de algum campo conhecido (ex: "First name", "Tipo de Exame")
      let matchedField = null;
      for (const fk of fieldKeys) {
        if (!fk) continue;
        if (rest.toLowerCase().startsWith(fk.toLowerCase())) {
          const after = rest[fk.length];
          if (!after || /[\s=!<>+\-*/%^(),?:&|]/.test(after)) {
            matchedField = fk;
            break;
          }
        }
      }
      if (matchedField) {
        tokens.push({ type: "val", value: values[matchedField] });
        i += matchedField.length;
        continue;
      }

      // Operadores compostos
      const op2 = /^(==|!=|<>|<=|>=|&&|\|\|)/.exec(rest);
      if (op2) {
        tokens.push({ type: "op", value: op2[0] === "<>" ? "!=" : op2[0] });
        i += op2[0].length;
        continue;
      }

      // Operadores simples e pontuação
      if ("+-*/%^=<>!(),?:".includes(rest[0])) {
        tokens.push({ type: "op", value: rest[0] });
        i += 1;
        continue;
      }

      // Identificadores, operadores por palavra (and/or/not/contains) ou chamadas de função
      const idMatch = /^[a-zA-ZÀ-ÿ_][a-zA-ZÀ-ÿ0-9_]*/.exec(rest);
      if (idMatch) {
        const word = idMatch[0];
        const low = word.toLowerCase();
        if (low === "and" || low === "e") tokens.push({ type: "op", value: "&&" });
        else if (low === "or" || low === "ou") tokens.push({ type: "op", value: "||" });
        else if (low === "not" || low === "nao" || low === "não") tokens.push({ type: "op", value: "!" });
        else if (low === "contains" || low === "contem" || low === "contém") tokens.push({ type: "op", value: "contains" });
        else if (low === "true" || low === "verdadeiro" || low === "sim" || low === "yes") tokens.push({ type: "val", value: true });
        else if (low === "false" || low === "falso") tokens.push({ type: "val", value: false });
        else tokens.push({ type: "id", value: word });
        i += word.length;
        continue;
      }

      // Caractere desconhecido: avança
      i += 1;
    }

    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function parseTernary() {
      const cond = parseOr();
      if (peek()?.type === "op" && peek().value === "?") {
        next();
        const yes = parseTernary();
        if (peek()?.type === "op" && peek().value === ":") next();
        const no = parseTernary();
        return truthy(cond) ? yes : no;
      }
      return cond;
    }

    function parseOr() {
      let left = parseAnd();
      while (peek()?.type === "op" && peek().value === "||") {
        next();
        const right = parseAnd();
        left = truthy(left) || truthy(right);
      }
      return left;
    }

    function parseAnd() {
      let left = parseComp();
      while (peek()?.type === "op" && peek().value === "&&") {
        next();
        const right = parseComp();
        left = truthy(left) && truthy(right);
      }
      return left;
    }

    function parseComp() {
      let left = parseAdd();
      while (peek()?.type === "op" && ["=", "==", "!=", "<", ">", "<=", ">=", "contains"].includes(peek().value)) {
        const op = next().value;
        const right = parseAdd();
        if (op === "contains") {
          left = String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase());
        } else if (op === "=" || op === "==") {
          left = compareEq(left, right);
        } else if (op === "!=") {
          left = !compareEq(left, right);
        } else {
          const ln = toNum(left), rn = toNum(right);
          if (op === "<") left = ln < rn;
          else if (op === ">") left = ln > rn;
          else if (op === "<=") left = ln <= rn;
          else if (op === ">=") left = ln >= rn;
        }
      }
      return left;
    }

    function compareEq(a, b) {
      if (typeof a === "boolean" || typeof b === "boolean") return truthy(a) === truthy(b);
      const sa = String(a ?? "").trim();
      const sb = String(b ?? "").trim();
      if (sa !== "" && sb !== "" && !Number.isNaN(Number(sa.replace(",", "."))) && !Number.isNaN(Number(sb.replace(",", ".")))) {
        return Number(sa.replace(",", ".")) === Number(sb.replace(",", "."));
      }
      return sa.toLowerCase() === sb.toLowerCase();
    }

    function parseAdd() {
      let left = parseMul();
      while (peek()?.type === "op" && (peek().value === "+" || peek().value === "-")) {
        const op = next().value;
        const right = parseMul();
        if (op === "+") {
          const ln = Number(String(left ?? "").replace(",", "."));
          const rn = Number(String(right ?? "").replace(",", "."));
          if (String(left ?? "").trim() !== "" && String(right ?? "").trim() !== "" && Number.isFinite(ln) && Number.isFinite(rn)) {
            left = ln + rn;
          } else {
            left = String(left ?? "") + String(right ?? "");
          }
        } else {
          left = toNum(left) - toNum(right);
        }
      }
      return left;
    }

    function parseMul() {
      let left = parsePow();
      while (peek()?.type === "op" && (peek().value === "*" || peek().value === "/" || peek().value === "%")) {
        const op = next().value;
        const right = parsePow();
        if (op === "*") left = toNum(left) * toNum(right);
        else if (op === "/") {
          const d = toNum(right);
          left = d === 0 ? 0 : toNum(left) / d;
        } else left = toNum(left) % (toNum(right) || 1);
      }
      return left;
    }

    function parsePow() {
      let left = parseUnary();
      if (peek()?.type === "op" && peek().value === "^") {
        next();
        const right = parsePow();
        left = Math.pow(toNum(left), toNum(right));
      }
      return left;
    }

    function parseUnary() {
      if (peek()?.type === "op" && peek().value === "-") { next(); return -toNum(parseUnary()); }
      if (peek()?.type === "op" && peek().value === "+") { next(); return toNum(parseUnary()); }
      if (peek()?.type === "op" && peek().value === "!") { next(); return !truthy(parseUnary()); }
      return parsePrimary();
    }

    function parsePrimary() {
      const t = peek();
      if (!t) return "";
      if (t.type === "val") { next(); return t.value; }
      if (t.type === "op" && t.value === "(") {
        next();
        const v = parseTernary();
        if (peek()?.type === "op" && peek().value === ")") next();
        return v;
      }
      if (t.type === "id") {
        next();
        const fnName = t.value.toLowerCase();
        if (peek()?.type === "op" && peek().value === "(") {
          next(); // '('
          const args = [];
          while (peek() && !(peek().type === "op" && peek().value === ")")) {
            args.push(parseTernary());
            if (peek()?.type === "op" && peek().value === ",") next();
          }
          if (peek()?.type === "op" && peek().value === ")") next();
          const fn = BUILTIN_FUNCS[fnName];
          return fn ? fn(...args) : "";
        }
        // Identificador sem parênteses: procura campo ou retorna string
        const k = Object.keys(values).find((key) => key.toLowerCase() === fnName);
        return k !== undefined ? values[k] : t.value;
      }
      next();
      return "";
    }

    try {
      const res = parseTernary();
      if (typeof res === "number") {
        return Number.isFinite(res) ? (Number.isInteger(res) ? String(res) : String(Math.round(res * 10000) / 10000)) : "0";
      }
      return res;
    } catch {
      return "";
    }
  }

  function truthy(v) {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0 && !Number.isNaN(v);
    const s = String(v ?? "").trim().toLowerCase();
    return s !== "" && s !== "0" && s !== "false" && s !== "no" && s !== "nao" && s !== "não" && s !== "off";
  }

  // Registra todos os renderizadores Pro nativamente!
  hooks.renderers = {
    if(node, r) {
      for (const branch of node.branches) {
        if (truthy(evalExpr(branch.cond, r.values))) {
          r.walk(branch.children);
          return;
        }
      }
      if (node.otherwise) r.walk(node.otherwise);
    },
    expr(node, r) {
      const val = evalExpr(node.src, r.values);
      r.put(val ?? "");
    },
    site(node, r) {
      if (typeof r.ctx.site === "function") {
        r.put(r.ctx.site(node) ?? "");
        return;
      }
      const kind = (node.plain[0] ?? "text").toLowerCase();
      if (kind === "title") r.put(r.ctx.siteTitle ?? (typeof document !== "undefined" ? document.title : ""));
      else if (kind === "url") r.put(r.ctx.siteUrl ?? (typeof location !== "undefined" ? location.href : ""));
      else if (kind === "domain") r.put(r.ctx.siteDomain ?? (typeof location !== "undefined" ? location.hostname : ""));
      else if (kind === "selection") r.put(r.ctx.siteSelection ?? "");
      else if (node.named?.selector && typeof document !== "undefined") {
        try {
          const el = document.querySelector(node.named.selector);
          r.put(el ? (el.value ?? el.textContent ?? "").trim() : "");
        } catch { r.put(""); }
      } else {
        r.put("");
      }
    },
    lookup(node, r) {
      r.put(node.named?.default ?? "");
    },
    key(node, r) {
      const key = (node.plain[0] || node.named.key || "tab").toLowerCase();
      r.step({ type: "key", key });
    },
    wait(node, r) {
      const sec = parseFloat(node.plain[0] || node.named.seconds || "0.5") || 0.5;
      r.step({ type: "wait", seconds: sec });
    },
  };

  function render(tree, values, ctx = {}, html = false) {
    let out = "", caret = false;
    ctx.actions = [];
    const put = (v) => { out += html ? escapeHtml(v) : String(v); };
    const r = { values, ctx, put, walk: null, step: (action) => { out += ACTION; ctx.actions.push(action); } };
    const walk = (nodes) => {
      for (const node of nodes) {
        if (ADVANCED_TYPES.has(node.type)) {
          if (node.type === "expr") {
            const exact = Object.keys(values).find((k) => k.toLowerCase() === node.src.toLowerCase());
            if (exact !== undefined) { put(values[exact] ?? ""); continue; }
          }
          const pro = hooks.renderers[node.type];
          if (pro) pro(node, r);
          continue;
        }
        switch (node.type) {
          case "text": out += node.value; break;
          case "cursor": if (!caret) { out += CARET; caret = true; } break;
          case "clipboard": put(ctx.clipboard ?? ""); break;
          case "time": put(formatDate(shiftDate(ctx.now ?? new Date(), node.named.shift), node.plain[0] || node.named.format || "DD/MM/YYYY")); break;
          case "formtext": case "formparagraph": case "formmenu": put(values[node.named.name] ?? ""); break;
          case "formdate": {
            const v = values[node.named.name];
            const d = /^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? new Date(v + "T12:00:00") : null;
            put(d ? formatDate(d, node.named.format || node.plain[0] || "DD/MM/YYYY") : "");
            break;
          }
          case "formtoggle": if (values[node.named.name]) walk(node.children); break;
          case "note": break;
          default:
            put(`{${node.type}${node.plain.length || Object.keys(node.named).length ? ": " + [...Object.entries(node.named).map(([k, v]) => `${k}=${v}`), ...node.plain].join("; ") : ""}}`);
        }
      }
    };
    r.walk = walk;
    walk(tree);
    return out;
  }

  function splitCaret(text) {
    const at = text.indexOf(CARET);
    if (at < 0) return { text, back: 0 };
    const clean = text.replace(CARET, "");
    return { text: clean, back: clean.length - at };
  }

  function shiftDate(date, shift) {
    const d = new Date(date.getTime());
    if (!shift) return d;
    const re = /([+-]\d+)\s*([YMWDhmAS])/gi;
    let m;
    while ((m = re.exec(shift))) {
      const n = parseInt(m[1], 10);
      const unit = m[2];
      switch (unit) {
        case "Y": case "y": case "A": case "a": d.setFullYear(d.getFullYear() + n); break;
        case "M": d.setMonth(d.getMonth() + n); break;
        case "W": case "w": case "S": case "s": d.setDate(d.getDate() + 7 * n); break;
        case "D": case "d": d.setDate(d.getDate() + n); break;
        case "h": case "H": d.setHours(d.getHours() + n); break;
        case "m": d.setMinutes(d.getMinutes() + n); break;
      }
    }
    return d;
  }

  const MONTHS_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const DAYS_PT = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

  function ordinalPt(n) {
    return n === 1 ? "1º" : String(n);
  }

  function formatDate(d, fmt) {
    const pad = (n, w = 2) => String(n).padStart(w, "0");
    const h12 = d.getHours() % 12 || 12;
    const tokens = {
      YYYY: () => String(d.getFullYear()), YY: () => String(d.getFullYear()).slice(-2),
      MMMM: () => MONTHS_PT[d.getMonth()], MMM: () => MONTHS_PT[d.getMonth()].slice(0, 3), MM: () => pad(d.getMonth() + 1), M: () => String(d.getMonth() + 1),
      Do: () => ordinalPt(d.getDate()), DD: () => pad(d.getDate()), D: () => String(d.getDate()),
      dddd: () => DAYS_PT[d.getDay()], ddd: () => DAYS_PT[d.getDay()].slice(0, 3),
      HH: () => pad(d.getHours()), H: () => String(d.getHours()), hh: () => pad(h12), h: () => String(h12),
      mm: () => pad(d.getMinutes()), ss: () => pad(d.getSeconds()), A: () => (d.getHours() < 12 ? "AM" : "PM"), a: () => (d.getHours() < 12 ? "am" : "pm"),
    };
    return fmt.replace(/\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|Do|DD|D|dddd|ddd|HH|H|hh|h|mm|ss|A|a/g, (t, lit) => (lit !== undefined ? lit : tokens[t]()));
  }

  root.TFTemplate = {
    parse, fields, render, splitCaret, formatDate, shiftDate, parseArgs,
    proParts, advancedParts, evalExpr, childLists, extend, CARET, ACTION
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
