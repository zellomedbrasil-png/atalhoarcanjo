# 🩺 Atalhos Arcanjo — Expansor de Texto Médico & Produtividade (100% em Português e 100% Liberado)

Aplicativo e extensão de navegador inspirado no [Typefill](https://github.com/lagudafuadtosin/typefill), **totalmente traduzido para Português do Brasil (PT-BR)**, **100% liberado (todos os recursos Pro integrados nativamente sem limites ou licenças)** e **customizado para a rotina médica** em **Gastroenterologia e Hepatologia**, **Clínica Médica**, **Geriatria**, **Consultórios de Alto Fluxo** e **Uso Profissional Geral**.

---

## ✨ Diferenciais desta Versão

1. **100% Liberado (Recursos Pro Nativos e Gratuitos)**:
   - **Condicionais Inteligentes (`{if: ...}`, `{elseif: ...}`, `{else}`, `{endif}`)**: Adapta automaticamente o texto clínico conforme escolhas em menus, presença de sinais de alarme, sexo ou faixa etária.
   - **Motor de Fórmulas e Calculadoras Médicas (`{= ...}`)**:
     - `{=imc(Peso, Altura)}` e `{=classImc(Peso, Altura, Idade)}` — Calcula o IMC (aceitando altura em metros `1.70` ou cm `170`) e classifica automaticamente segundo critérios de **Adulto (OMS)** ou **Idoso ≥ 60 anos (OPAS/MS)**.
     - `{=cockcroft(Idade, Peso, Creatinina, Sexo)}` e `{=estagioDrc(...)}` — Calcula o **Clearance de Creatinina (Cockcroft-Gault)** com ajuste automático por sexo e classifica o estágio de função renal (G1 a G5).
     - `{=fib4(Idade, AST, ALT, Plaquetas)}` e `{=riscoFib4(...)}` — Calcula o índice **FIB-4** para estratificação de fibrose hepática em MASLD/Esteatose Hepática, ajustando o ponto de corte para idade ≥ 65 anos.
     - `{=meld(Bilirrubina, INR, Creatinina, Sodio)}` — Calcula o escore **MELD-Na** para hepatopatia crônica/cirrose.
   - **Automação de Formulários (`{key: tab}`, `{key: enter}`, `{wait: 0.5}`)**: Preenche vários campos seguidos de um prontuário eletrônico automaticamente.
   - **Dados da Página (`{site: selection}`, `{site: title}`, `{site: url}`, `{site: text; selector=...}`)**: Captura o texto selecionado ou dados da aba atual.

2. **Prancheta de Consulta Rápida (Modo Standalone / Web App)**:
   - Na própria página do aplicativo (`options.html`), você conta com uma **Prancheta de Consulta Rápida** com botões de 1 clique para disparar `/soap`, `/ef`, `/gastro`, `/drge`, `/hpylori`, `/sii`, `/fib4`, `/prep-colono`, `/aga`, `/clcr`, `/receita` e `/atestado`, copiar tudo com 1 clique ou imprimir/gerar PDF.

3. **Biblioteca Médica Completa Pré-Carregada (23 Atalhos Prontos)**:
   - **01. Clínica Médica & Alto Fluxo**: `/soap`, `/consulta`, `/ef`, `/retorno`, `/checkup`
   - **02. Gastroenterologia & Hepatologia**: `/gastro`, `/drge`, `/hpylori`, `/sii`, `/fib4`, `/meld`, `/prep-eda`, `/prep-colono`, `/laudo-eda`, `/exames-gastro`
   - **03. Geriatria**: `/aga`, `/clcr`, `/quedas`, `/delirium`, `/desprescricao`
   - **04. Prescrições, Atestados & Documentos**: `/receita`, `/atestado`, `/relatorio`, `/encaminhamento`, `/assinatura`
   - **05. Comunicação & Uso Geral**: `/msg-exames`, `/msg-retorno`, `/preencher-form`, `/hoje`

---

## 🚀 Como Instalar e Usar

### Opção 1: Instalar como Extensão no Chrome, Edge ou Brave (Recomendado)
1. Os arquivos compilados já estão prontos na pasta `dist/chrome`.
2. No seu navegador, abra `chrome://extensions` (ou `edge://extensions`).
3. Ative a chave **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** (Load unpacked) e selecione a pasta:
   `c:\Users\1\OneDrive\Área de Trabalho\atalhosarcanjo\dist\chrome`
5. Pronto! A página do **Atalhos Arcanjo** se abrirá e seus atalhos funcionarão em qualquer site, prontuário eletrônico web, WhatsApp Web, Gmail e Google Docs.

### Opção 2: Usar Direto pela Prancheta Clínica (Sem instalar extensão)
- Basta abrir o arquivo `src/options.html` (ou `dist/chrome/options.html`) diretamente no navegador para usar a **Prancheta de Consulta Rápida**, expandir seus atalhos e copiar com 1 clique para qualquer prontuário desktop.

---

## 🛠️ Comandos de Desenvolvimento e Testes

```bash
# Gerar as pastas dist/chrome e dist/firefox
npm run build

# Executar a suíte de testes automatizados (motor, recursos Pro, calculadoras e biblioteca médica)
npm test
```
