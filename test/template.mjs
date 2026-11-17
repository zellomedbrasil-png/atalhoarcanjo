// Testes automatizados do motor Atalhos Arcanjo:
// 1. Campos interativos, toggles, datas em português, repetições, importação e posição do cursor
// 2. Recursos Pro 100% liberados: condicionais {if/elseif/else}, fórmulas matemáticas, {site}, {key} e {wait}
// 3. Calculadoras médicas integradas: IMC (adulto e idoso), Cockcroft-Gault (ClCr), FIB-4 e MELD-Na
// 4. Validação integral de todos os atalhos médicos de src/medical-starters.js

import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctxGlobal = { console };
vm.createContext(ctxGlobal);
vm.runInContext(readFileSync("src/template.js", "utf8"), ctxGlobal, { filename: "src/template.js" });
vm.runInContext(readFileSync("src/medical-starters.js", "utf8"), ctxGlobal, { filename: "src/medical-starters.js" });

const T = ctxGlobal.TFTemplate;
const STARTERS = ctxGlobal.MEDICAL_STARTERS;

let failed = 0, n = 0;
const check = (name, got, want) => {
  n++;
  const ok = typeof want === "function" ? want(got) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${String(n).padStart(2)}. ${ok ? "✔" : "✘ FALHOU"} ${name}${ok ? "" : `\n     obtido:   ${JSON.stringify(got)}\n     esperado: ${typeof want === "function" ? want.toString() : JSON.stringify(want)}`}`);
};
const run = (src, values = {}, ctx = {}, resolve) => T.render(T.parse(src, resolve), values, ctx);

// 1. Recursos Básicos e Datas em Português
check("caixa de texto", run("Olá, {formtext: name=Nome}!", { Nome: "Dr. Arcanjo" }), "Olá, Dr. Arcanjo!");
check("repetição de campo", run("{formtext: name=Primeiro nome}, confirmado {=Primeiro nome}", { "Primeiro nome": "Maria" }), "Maria, confirmado Maria");
check("opções de menu dropdown", T.fields(T.parse("{formmenu: name=Dose; default=20mg; 40mg; 80mg}"))[0].options, ["20mg", "40mg", "80mg"]);
check("toggle desmarcado", run("A{formtoggle: name=Obs; default=no} B{endformtoggle}.", { Obs: false }), "A.");
check("toggle marcado", run("A{formtoggle: name=Obs} B{endformtoggle}.", { Obs: true }), "A B.");
check("bloco note não é digitado no texto final", run("A{note}{formmenu: name=Escolha; default=1; 2} oculto{endnote}B", { Escolha: "1" }), "AB");
check("campos dentro de note ainda são solicitados", T.fields(T.parse("{note}{formmenu: name=Escolha; default=1; 2}{endnote}")).map((f) => f.name), ["Escolha"]);
check("data padrão brasileiro e deslocamento", run("{time: DD/MM/YYYY; shift=+1D}", {}, { now: new Date(2026, 9, 31, 12) }), "01/11/2026");
check("data por extenso em português", run("{time: D [de] MMMM [de] YYYY}", {}, { now: new Date(2026, 10, 17, 12) }), "17 de novembro de 2026");
check("seletor de data no primeiro dia do mês (1º)", run("{formdate: name=Retorno; format=Do [de] MMMM}", { Retorno: "2026-12-01" }), "1º de dezembro");
check("importação de outro atalho", run("Início {import: /assinatura} Fim", {}, {}, (s) => (s === "/assinatura" ? "CRM 12345" : null)), "Início CRM 12345 Fim");
check("marcação de cursor {cursor}", T.splitCaret(run("ab{cursor}cd")), { text: "abcd", back: 2 });
check("chaves escapadas", run("\\{texto literal\\}"), "{texto literal}");

// 2. Recursos Pro 100% Desbloqueados
check("proParts retorna sempre vazio (100% liberado, sem bloqueios)", T.proParts(T.parse("{if: 1}x{endif}{=1+1}{site: url}{key: tab}")), []);
check("fórmula matemática com fixed()", run("{formtext: name=Qty; default=3} x 2.50 = {=fixed(Qty * 2.5, 2)}", { Qty: "3" }), "3 x 2.50 = 7.50");
check("condicional {if} / {elseif} / {else} liberada", [
  run("{formmenu: name=Size; default=S; M; L}{if: Size = 'L'} grande{elseif: Size = 'M'} médio{else} pequeno{endif}", { Size: "L" }),
  run("{formmenu: name=Size; default=S; M; L}{if: Size = 'L'} grande{elseif: Size = 'M'} médio{else} pequeno{endif}", { Size: "M" }),
  run("{formmenu: name=Size; default=S; M; L}{if: Size = 'L'} grande{elseif: Size = 'M'} médio{else} pequeno{endif}", { Size: "S" }),
], ["L grande", "M médio", "S pequeno"]);
check("captura de dados da página {site}", run("Página: {site: title} ({site: selection})", {}, { siteTitle: "Prontuário Eletrônico", siteSelection: "Paciente estável" }), "Página: Prontuário Eletrônico (Paciente estável)");
check("passos de teclado {key: tab} e {wait}", (() => {
  const ctx = {};
  const out = run("Campo1{key: tab}Campo2{wait: 0.5}{key: enter}", {}, ctx);
  return { parts: out.split(T.ACTION), actions: ctx.actions };
})(), {
  parts: ["Campo1", "Campo2", "", ""],
  actions: [{ type: "key", key: "tab" }, { type: "wait", seconds: 0.5 }, { type: "key", key: "enter" }],
});

// 3. Calculadoras Médicas Nativas (IMC Adulto/Idoso, Cockcroft-Gault, FIB-4, MELD-Na)
check("calculadora de IMC (altura em metros e em cm)", [
  run("{=imc(72, 1.70)}"),
  run("{=imc(72, 170)}"),
], ["24.9", "24.9"]);
check("classificação de IMC diferenciada Adulto vs Idoso (Geriatria)", [
  run("{=classImc(62, 1.70, 35)}"), // IMC 21.5 em adulto -> Eutrofia
  run("{=classImc(62, 1.70, 75)}"), // IMC 21.5 em idoso >= 60a -> Baixo peso para idoso (<= 22)
], ["Eutrofia (18,5 a 24,9 kg/m²)", "Baixo peso para idoso (≤ 22 kg/m²)"]);
check("calculadora de Clearance de Creatinina (Cockcroft-Gault Masc vs Fem)", [
  run("{=cockcroft(78, 64, 1.1, 'Masculino')}"),
  run("{=cockcroft(78, 64, 1.1, 'Feminino')}"),
], ["50.1", "42.6"]);
check("calculadora de índice FIB-4 (Gastroenterologia/Hepatologia)", [
  run("{=fib4(54, 32, 40, 210)}"),
  run("{=fib4(54, 32, 40, 210000)}"), // aceita plaquetas em mil/mm³ ou absolutas
], ["1.30", "1.30"]);
check("calculadora de MELD-Na (Hepatologia)", run("{=meld(2.0, 1.5, 1.2, 134)}"), "17");

// 4. Validação de Todos os Atalhos do Pacote Médico (src/medical-starters.js)
check("pacote médico possui pelo menos 25 atalhos estruturados", STARTERS.length >= 25, true);

let starterErrors = [];
for (const s of STARTERS) {
  try {
    const resolve = (sc) => STARTERS.find((x) => x.shortcut === sc.trim())?.text ?? "";
    const tree = T.parse(s.text, resolve);
    const flds = T.fields(tree);
    const defaults = {};
    for (const f of flds) defaults[f.name] = f.default;
    const rendered = T.render(tree, defaults, { now: new Date(2026, 10, 17, 12) });
    if (rendered.includes("[Typefill Pro]")) {
      starterErrors.push(`${s.shortcut}: contém bloqueio [Typefill Pro]`);
    }
    if (!rendered.trim()) {
      starterErrors.push(`${s.shortcut}: renderizou vazio`);
    }
  } catch (err) {
    starterErrors.push(`${s.shortcut}: erro ${err.message}`);
  }
}
check("todos os atalhos médicos renderizam sem erros e sem travas Pro", starterErrors, []);

console.log(failed ? `\n✘ ${failed} teste(s) falharam` : `\n✔ Todos os ${n} testes passaram com sucesso!`);
process.exit(failed ? 1 : 0);
