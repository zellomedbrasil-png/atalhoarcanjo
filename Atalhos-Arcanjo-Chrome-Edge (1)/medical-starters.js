// Biblioteca Médica e Profissional Inicial do Atalhos Arcanjo
// Pensada para Gastroenterologia, Clínica Médica, Geriatria, Consultório de Alto Fluxo e Uso Geral.
// Todos os atalhos são 100% editáveis pelo médico na tela do aplicativo.

(function (root) {
  "use strict";

  const MEDICAL_STARTERS = [
    // =========================================================================
    // 01. CLÍNICA MÉDICA & ALTO FLUXO
    // =========================================================================
    {
      shortcut: "/soap",
      label: "Evolução Clínica Rápida (SOAP + Cálculo de IMC)",
      folder: "01. Clínica Médica & Alto Fluxo",
      text:
`# SUBJETIVO (S):
Paciente comparece para atendimento referindo: {formparagraph: name=Queixa e HDA; default=Paciente em acompanhamento clínico, refere bom controle geral.}
• Comorbidades: {formtext: name=Comorbidades; default=Nega comorbidades prévias conhecidas}
• Medicações em uso: {formtext: name=Medicações em uso; default=Nega uso contínuo}
• Alergias: {formtext: name=Alergias; default=Nega alergias medicamentosas}

# OBJETIVO (O):
• Dados Vitais: PA {formtext: name=PA; default=120x80 mmHg} | FC {formtext: name=FC; default=74 bpm} | SpO2 {formtext: name=SpO2; default=98% AA}
• Antropometria: Peso {formtext: name=Peso (kg); default=72} kg | Altura {formtext: name=Altura (m); default=1.70} m | Idade: {formtext: name=Idade; default=45} anos
• IMC Calculado: {=imc(Peso (kg), Altura (m))} kg/m² — {=classImc(Peso (kg), Altura (m), Idade)}
• Exame Físico: BEG, LOTE, corado, hidratado, anictérico, acianótico, afebril.
  - ACV: RCR em 2T, BNF, sem sopros.
  - AR: MV+ bilateralmente, sem ruídos adventícios.
  - Abdome: {formmenu: name=Exame Abdominal; default=Plano, flácido, RHA+, indolor à palpação, sem visceromegalias ou sinais de irritação peritoneal.; Globoso, flácido, RHA+, discreto desconforto em epigástrio à palpação profunda, sem defesa.; Distendido, timpânico, RHA+, doloroso difusamente à palpação profunda, Blumberg negativo.}
  - Extremidades: Pulsos simétricos, panturrilhas livres, sem edemas.

# AVALIAÇÃO (A):
• Hipótese / Diagnóstico: {formtext: name=Hipótese Diagnóstica; default=Em investigação clínica}

# PLANO / CONDUTA (P):
• {formparagraph: name=Conduta; default=1. Orientações dietéticas e comportamentais;\n2. Solicito exames complementares;\n3. Retorno com resultados ou antes se sinais de alarme.}{cursor}`
    },
    {
      shortcut: "/consulta",
      label: "Anamnese Completa de 1ª Consulta (Alto Fluxo)",
      folder: "01. Clínica Médica & Alto Fluxo",
      text:
`ANAMNESE — PRIMEIRA CONSULTA ({time: DD/MM/YYYY})

1. QUEIXA PRINCIPAL: {formtext: name=Queixa Principal}
2. HISTÓRIA DA DOENÇA ATUAL (HDA):
{formparagraph: name=HDA}

3. ANTECEDENTES E CONDIÇÕES CLÍNICAS:
• Patológicos Pregressos: {formtext: name=Comorbidades; default=HAS / DM2 / Dislipidemia — nega outras}
• Cirurgias e Internações: {formtext: name=Cirurgias Prévias; default=Nega cirurgias prévias}
• Medicações de Uso Contínuo: {formparagraph: name=Medicações; default=Em uso regular conforme receita prévia}
• Alergias Medicamentosas/Alimentares: {formtext: name=Alergias; default=Nega alergias conhecidas}
• História Familiar: {formtext: name=História Familiar; default=Nega neoplasias digestivas ou eventos cardiovasculares precoces na família}

4. HÁBITOS DE VIDA E INTERROGATÓRIO SINTOMATOLÓGICO:
• Tabagismo: {formmenu: name=Tabagismo; default=Nega tabagismo; Ex-tabagista; Tabagista ativo} | Etilismo: {formmenu: name=Etilismo; default=Nega etilismo; Etilista social esporádico; Consumo frequente}
• Atividade Física: {formmenu: name=Atividade Física; default=Sedentário; Ativo (3x ou mais/semana); Irregular}
• Sono e Humor: {formtext: name=Sono e Humor; default=Sono reparador, humor estável}
• Hábito Intestinal e Urinário: {formtext: name=Hábito Intestinal e Urinário; default=Fisiológicos, sem queixas}

5. CONDUTA:
{cursor}`
    },
    {
      shortcut: "/ef",
      label: "Exame Físico Completo Normal + Cálculo Automático de IMC",
      folder: "01. Clínica Médica & Alto Fluxo",
      text:
`EXAME FÍSICO:
• Estado Geral: Bom estado geral (BEG), lúcido e orientado no tempo e espaço (LOTE), normocorado, hidratado, anictérico, acianótico, afebril ao toque, eupneico em ar ambiente.
• Sinais Vitais: PA: {formtext: name=PA; default=120x80} mmHg | FC: {formtext: name=FC; default=72} bpm | SpO2: {formtext: name=SpO2; default=98}%
• Antropometria: Peso: {formtext: name=Peso (kg); default=70} kg | Altura: {formtext: name=Altura (m); default=1.70} m | IMC: {=imc(Peso (kg), Altura (m))} kg/m² ({=classImc(Peso (kg), Altura (m), 45)})
• Aparelho Cardiovascular: Ritmo cardíaco regular em 2 tempos, bulhas normofonéticas, sem sopros ou estalidos.
• Aparelho Respiratório: Murmúrio vesicular fisiológico universalmente audível, sem ruídos adventícios.
• Abdome: Plano, flácido, ruídos hidroaéreos presentes e normoativos, timpânico, indolor à palpação superficial e profunda, sem massas ou visceromegalias palpáveis. Sinal de Murphy e Blumberg negativos.{formtoggle: name=Alteração abdominal específica; default=no} Obs. Abdominal: {formtext: name=Detalhe Abdominal; default=Doloroso à palpação profunda de epigástrio, sem sinais de peritonite.}{endformtoggle}
• Extremidades: Perfusão periférica preservada (< 2s), pulsos distais amplos e simétricos, panturrilhas livres e indolores, sem edema de membros inferiores.{cursor}`
    },
    {
      shortcut: "/retorno",
      label: "Evolução Rápida de Retorno e Checagem de Exames",
      folder: "01. Clínica Médica & Alto Fluxo",
      text:
`CONSULTA DE RETORNO ({time: DD/MM/YYYY})

• Evolução clínica no período: {formmenu: name=Evolução; default=Refere melhora significativa dos sintomas após início do tratamento proposto.; Estável, mantendo bom controle clínico e boa tolerância medicamentosa.; Refere melhora parcial dos sintomas, sem sinais de alarme.; Assintomático, trazendo exames solicitados na última consulta.}
• Adesão ao tratamento: {formmenu: name=Adesão; default=Boa adesão medicamentosa e dietética, sem efeitos adversos.; Adesão parcial às medidas dietéticas, boa tolerância às medicações.; Uso irregular da medicação.}
• Exames Complementares Avaliados Hoje:
{formparagraph: name=Exames Avaliados; default=Laboratoriais dentro dos parâmetros esperados para a faixa etária.}
• Exame Físico Sumário: BEG, corado, hidratado, PA {formtext: name=PA; default=120x80 mmHg}, abdome flácido e indolor, sem edemas.
• Conduta:
{formparagraph: name=Conduta de Retorno; default=1. Mantenho conduta clínica e orientações de estilo de vida;\n2. Renovação de prescrição;\n3. Retorno programado em 3 a 6 meses.}{cursor}`
    },
    {
      shortcut: "/checkup",
      label: "Solicitação de Exames — Check-up Laboratorial Completo",
      folder: "01. Clínica Médica & Alto Fluxo",
      text:
`SOLICITAÇÃO DE EXAMES COMPLEMENTARES ({formmenu: name=Perfil; default=Check-up Clínico Completo; Check-up Metabólico e Hepático; Check-up Geriátrico / Vitaminas}):

1. Hemograma completo
2. Glicemia de jejum e Hemoglobina Glicada (HbA1c)
3. Colesterol total, HDL, LDL, VLDL e Triglicerídeos
4. Ureia, Creatinina, Sódio, Potássio e Ácido Úrico
5. TGO (AST), TGP (ALT), Fosfatase Alcalina e Gama-GT
6. TSH e T4 livre
7. Ferritina, Ferro sérico e Índice de Saturação de Transferrina
8. Vitamina B12, Ácido Fólico e 25-Hidroxivitamina D
9. EAS (Urina tipo I){if: Perfil = 'Check-up Geriátrico / Vitaminas'}
10. Eletroforese de proteínas séricas, Cálcio iônico, Magnésio, Fósforo e Albumina
11. Parasitológico de fezes e Pesquisa de sangue oculto nas fezes{endif}{formtoggle: name=Incluir PSA (Homens); default=no}
• PSA total e livre{endformtoggle}{formtoggle: name=Incluir Sorologias (Hepatites B e C / HIV / Sífilis); default=no}
• HBsAg, Anti-HBc total, Anti-HBs, Anti-HCV, HIV 1/2 e VDRL{endformtoggle}{formtoggle: name=Incluir USG de Abdome Total e ECG; default=yes}
• Ultrassonografia de Abdome Total
• Eletrocardiograma (ECG) de repouso{endformtoggle}{cursor}`
    },

    // =========================================================================
    // 02. GASTROENTEROLOGIA & HEPATOLOGIA
    // =========================================================================
    {
      shortcut: "/gastro",
      label: "Anamnese Gastroenterológica Estruturada (Bristol + Sinais de Alarme)",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`ANAMNESE GASTROENTEROLÓGICA DIRECIONADA ({time: DD/MM/YYYY})

• Queixa Digestiva Principal: {formmenu: name=Sintoma Principal; default=Dispepsia / Epigastralgia / Plenitude pós-prandial; Pirose e Regurgitação ácida (DRGE); Alteração do hábito intestinal / Dor abdominal; Diarreia crônica / Distensão abdominal; Constipação intestinal crônica; Avaliação de Esteatose Hepática / Alteração de transaminases; Rastreamento de neoplasia digestiva}
• Tempo de evolução e características: {formparagraph: name=Detalhes da HDA; default=Sintomas iniciados há cerca de 3 meses, de caráter intermitente, exacerbados após refeições copiosas ou gordurosas.}
• Hábito Intestinal:
  - Frequência evacuatória: {formtext: name=Frequência Evacuatória; default=1x ao dia}
  - Consistência (Escala de Bristol): {formmenu: name=Escala de Bristol; default=Tipo 4 (Salsicha ou cobra, lisa e macia — Normal); Tipo 1 (Cíbalos duros e separados — Constipação grave); Tipo 2 (Forma de salsicha, mas grumosa — Constipação leve); Tipo 3 (Salsicha com fissuras na superfície — Normal); Tipo 5 (Pedaços macios com bordas definidas — Tendência diarreica); Tipo 6 (Pedaços aerados/pastosos — Diarreia leve); Tipo 7 (Totalmente líquida, sem pedaços sólidos — Diarreia líquida)}
  - Esforço evacuatório / sensação de evacuação incompleta: {formmenu: name=Disquezia; default=Nega; Presente}
• Fatores Alimentares e Medicamentosos:
  - Intolerâncias percebidas (lactose, glúten, FODMAPs): {formtext: name=Intolerâncias; default=Nega intolerâncias alimentares definidas}
  - Uso de AINEs / AAS / Corticoide / IBP prévio: {formtext: name=Uso de AINEs ou IBP; default=Nega uso recente de AINEs}
• Sinais de Alarme Digestivos: {formmenu: name=Sinais de Alarme; default=Ausentes (nega perda ponderal, disfagia, odinofagia, hematêmese, melena, enterorragia ou anemia); Presentes (ver descrição abaixo)}
{if: Sinais de Alarme != 'Ausentes (nega perda ponderal, disfagia, odinofagia, hematêmese, melena, enterorragia ou anemia)'}⚠️ ATENÇÃO — SINAIS DE ALARME PRESENTES: {formtext: name=Quais Sinais de Alarme; default=Perda ponderal involuntária / sangramento digestivo} -> Indicada investigação endoscópica prioritária.
{endif}• História Familiar Digestiva (Câncer Gástrico, CCR, DII, Doença Celíaca): {formtext: name=HF Digestiva; default=Nega história familiar de neoplasias do trato gastrointestinal em parentes de 1º grau}
• Endoscopias / Exames Prévios: {formtext: name=Exames Prévios; default=Não trouxe exames endoscópicos recentes}{cursor}`
    },
    {
      shortcut: "/drge",
      label: "Conduta e Prescrição — DRGE / Doença Dispéptica + Medidas Antirrefluxo",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`CONDUTA — DOENÇA DO REFLUXO GASTROESOFÁGICO / DISPEPSIA

1. TRATAMENTO MEDICAMENTOSO (USO INTERNO):
• {formmenu: name=IBP ou Bloqueador Ácido; default=Pantoprazol 40mg; Esomeprazol 40mg; Omeprazol 20mg; Dexlansoprazol 60mg; Vonoprazana 20mg} — Tomar 1 comprimido/cápsula {formmenu: name=Posologia IBP; default=em jejum, 30 minutos antes do café da manhã, por 8 semanas; 12/12h (30 min antes do café da manhã e do jantar) por 8 semanas; 1x ao dia por 4 a 8 semanas}.
{formtoggle: name=Associar Procinético; default=yes}• {formmenu: name=Procinético; default=Domperidona 10mg; Bromoprida 10mg; Cinitaprida 1mg} — Tomar 1 comprimido 15 a 20 minutos antes do almoço e do jantar por {formtext: name=Dias de Procinético; default=30 dias}.
{endformtoggle}{formtoggle: name=Associar Alginato / Protetor de Mucosa após refeições; default=no}• Alginato de Sódio + Bicarbonato de Sódio (suspensão) — Tomar 10 mL após as principais refeições e ao deitar, se pirose/regurgitação.
{endformtoggle}
2. MEDIDAS COMPORTAMENTAIS E DIETÉTICAS ANTIRREFLUXO ORIENTADAS:
• Não se deitar nas 2 a 3 horas seguintes às refeições (evitar refeições volumosas à noite);
• Elevar a cabeceira da cama em 15 cm (ou utilizar travesseiro antirrefluxo em cunha) se sintomas noturnos;
• Fracionar a dieta em volumes menores ao longo do dia, mastigando devagar;
• Evitar líquidos em excesso durante as refeições;
• Reduzir alimentos desencadeantes: frituras, gorduras, café em excesso, bebidas gaseificadas, bebidas alcoólicas, chocolate, menta/hortelã, embutidos e condimentos picantes;
• Cessar tabagismo e buscar controle ponderal.{cursor}`
    },
    {
      shortcut: "/hpylori",
      label: "Erradicação de H. pylori (1ª Linha / Quádruplo Bismuto / Levofloxacino)",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`TRATAMENTO DE ERRADICAÇÃO DO HELICOBACTER PYLORI (14 DIAS)
Esquema selecionado: {formmenu: name=Esquema H. pylori; default=1ª Linha Tríplice Otimizada (IBP dose dobrada + Amoxicilina 1g + Claritromicina 500mg — 14 dias); Quádruplo com Bismuto (IBP + Subcitrato de Bismuto + Tetraciclina + Metronidazol — 14 dias); Retratamento / 2ª Linha (IBP dose dobrada + Amoxicilina 1g + Levofloxacino 500mg — 14 dias)}

PRESCRIÇÃO (USO INTERNO — TRATAMENTO COMPLETO POR 14 DIAS):
{if: Esquema H. pylori = '1ª Linha Tríplice Otimizada (IBP dose dobrada + Amoxicilina 1g + Claritromicina 500mg — 14 dias)'}1. {formmenu: name=IBP Escolhido; default=Esomeprazol 40mg; Pantoprazol 40mg; Omeprazol 20mg; Vonoprazana 20mg} — Tomar 1 comprimido de 12/12 horas (30 min antes do café e 30 min antes do jantar) por 14 dias.
2. Amoxicilina 500mg (ou 1g) — Tomar 1.000 mg (1g) de 12/12 horas (junto ao café da manhã e jantar) por 14 dias.
3. Claritromicina 500mg — Tomar 1 comprimido de 12/12 horas (junto ao café da manhã e jantar) por 14 dias.{elseif: Esquema H. pylori = 'Quádruplo com Bismuto (IBP + Subcitrato de Bismuto + Tetraciclina + Metronidazol — 14 dias)'}1. {formmenu: name=IBP Escolhido; default=Esomeprazol 40mg; Pantoprazol 40mg; Omeprazol 20mg; Vonoprazana 20mg} — Tomar 1 comprimido de 12/12 horas (30 min antes do café e jantar) por 14 dias.
2. Subcitrato de Bismuto Coloidal 120mg — Tomar 2 cápsulas de 12/12 horas (ou 1 cápsula 4x/dia antes das refeições) por 14 dias.
3. Cloridrato de Tetraciclina 500mg — Tomar 1 cápsula de 6/6 horas após as refeições por 14 dias.
4. Metronidazol 400mg — Tomar 1 comprimido de 8/8 horas por 14 dias.{else}1. {formmenu: name=IBP Escolhido; default=Esomeprazol 40mg; Pantoprazol 40mg; Omeprazol 20mg; Vonoprazana 20mg} — Tomar 1 comprimido de 12/12 horas (30 min antes do café e jantar) por 14 dias.
2. Amoxicilina 1.000 mg (1g) — Tomar 1g de 12/12 horas após o café da manhã e jantar por 14 dias.
3. Levofloxacino 500mg — Tomar 1 comprimido 1x ao dia (após o almoço) por 14 dias.{endif}
{formtoggle: name=Associar Probiótico Adjuvante (Saccharomyces boulardii / Lactobacillus); default=yes}• Floratil (Saccharomyces boulardii 200mg) — Tomar 1 cápsula de 12/12 horas durante os 14 dias do antibiótico (para reduzir efeitos adversos gastrointestinais).{endformtoggle}

ORIENTAÇÕES AO PACIENTE:
• Completar rigorosamente os 14 dias sem interromper (a adesão é essencial para a cura da bactéria);
• Não ingerir bebidas alcoólicas durante todo o tratamento;
• Gosto metálico na boca ou fezes mais amolecidas/escurecidas (se uso de bismuto) podem ocorrer e são transitórios;
• Controle de erradicação: realizar {formmenu: name=Controle de Cura; default=Teste Respiratório com Ureia Marcada (C13) ou Pesquisa de Antígeno Fecal para H. pylori; Nova Endoscopia Digestiva Alta com pesquisa de H. pylori} no mínimo 4 semanas após o término do antibiótico e ao menos 14 dias sem uso de IBP.{cursor}`
    },
    {
      shortcut: "/sii",
      label: "Conduta — Síndrome do Intestino Irritável (SII-C, SII-D ou SII-M)",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`CONDUTA — SÍNDROME DO INTESTINO IRRITÁVEL ({formmenu: name=Subtipo SII; default=SII com predomínio de Diarreia (SII-D); SII com predomínio de Constipação (SII-C); SII Forma Mista / Dor e Distensão Abdominal (SII-M)})

1. MANEJO FARMACOLÓGICO DIRECIONADO:
• Antiespasmódico / Modulador da Motilidade: {formmenu: name=Antiespasmódico; default=Brometo de Pinavério 100mg — 1 cp de 12/12h durante as refeições; Cloridrato de Mebeverina 200mg — 1 cp de 12/12h 20 min antes das refeições; Maleato de Trimebutina 200mg — 1 cp de 12/12h ou 8/8h; Óleo de Hortelã-Pimenta (Mentha piperita) — 1 cápsula antes das refeições}
{if: Subtipo SII = 'SII com predomínio de Constipação (SII-C)'}• Fibra Solúvel / Osmótico: Psyllium (Plantago ovata) 1 envelope diluído em 250 mL de água 1 a 2x ao dia (ou Macrogol/PEG 4000 10g a 15g diluído em água 1x ao dia), associado à ingestão hídrica de 2,0 a 2,5 L/dia.{elseif: Subtipo SII = 'SII com predomínio de Diarreia (SII-D)'}• Controle Diarreico / Microbiota: {formmenu: name=Manejo SII-D; default=Rifaximina 550mg — 1 cp de 8/8h por 14 dias; Saccharomyces boulardii 200mg — 1 cáp de 12/12h por 30 dias; Loperamida 2mg sob demanda nos dias de maior frequência evacuatória; Colestiramina 4g se suspeita de má absorção de ácidos biliares}{else}• Simeticona 125mg (cápsula gelatinosa) — 1 cápsula após almoço e jantar se estufamento/meteorismo.{endif}

2. ORIENTAÇÕES DIETÉTICAS E DE ESTILO DE VIDA:
• Dieta com redução guiada de FODMAPs (evitar excesso de oligossacarídeos fermentáveis: feijão sem remolho prolongado, cebola/alho em excesso, trigo em grandes quantidades, leite integral se intolerância à lactose, adoçantes polióis como sorbitol/xilitol);
• Realizar refeições em horários regulares, mastigando bem;
• Prática regular de atividade física aeróbica e manejo do estresse/sono (regulação do eixo microbiota-intestino-cérebro).{cursor}`
    },
    {
      shortcut: "/fib4",
      label: "Calculadora de Esteatose Hepática (MASLD) & Índice FIB-4 Automático",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`AVALIAÇÃO DE DOENÇA HEPÁTICA ESTEATÓTICA ASSOCIADA À DISFUNÇÃO METABÓLICA (MASLD) & ESCORE FIB-4:

• Dados do Paciente:
  - Idade: {formtext: name=Idade; default=54} anos
  - AST (TGO): {formtext: name=AST (U/L); default=32} U/L
  - ALT (TGP): {formtext: name=ALT (U/L); default=40} U/L
  - Plaquetas: {formtext: name=Plaquetas (mil/mm³); default=210} mil/mm³
  - Grau de Esteatose ao Ultrassom: {formmenu: name=Grau USG; default=Esteatose Hepática Grau I (Leve); Esteatose Hepática Grau II (Moderada); Esteatose Hepática Grau III (Acentuada)}

• ESTRATIFICAÇÃO NÃO-INVASIVA DE FIBROSE HEPÁTICA (FIB-4):
  - Escore FIB-4 Calculado: {=fib4(Idade, AST (U/L), ALT (U/L), Plaquetas (mil/mm³))}
  - Interpretação Clínica: {=riscoFib4(Idade, AST (U/L), ALT (U/L), Plaquetas (mil/mm³))}

• CONDUTA TERAPÊUTICA:
  1. Meta de redução ponderal de 7% a 10% do peso corporal atual;
  2. Dieta padrão Mediterrâneo, suspensão de bebidas alcoólicas e de frutose industrializada/ultraprocessados;
  3. Exercício físico aeróbico + resistido (mínimo de 150–180 min/semana);
  4. Controle rigoroso dos fatores cardiometabólicos associados (glicemia/resistência insulínica, perfil lipídico e PA).{formtoggle: name=Solicitar Elastografia Hepática Transitória / ARFI; default=no}
  5. Solicito Elastografia Hepática para estadiamento complementar de fibrose.{endformtoggle}{cursor}`
    },
    {
      shortcut: "/meld",
      label: "Calculadora de Escore MELD-Na & Estadiamento de Cirrose (Child-Pugh)",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`AVALIAÇÃO DE HEPATOPATIA CRÔNICA / CIRROSE HEPÁTICA:

• Etiologia da Hepatopatia: {formtext: name=Etiologia; default=MASLD / Etilismo / Hepatite Viral}
• Classificação de Child-Pugh: {formmenu: name=Child-Pugh; default=Child-Pugh A (5-6 pontos — Compensada); Child-Pugh B (7-9 pontos — Comprometimento funcional significativo); Child-Pugh C (10-15 pontos — Descompensada)}
• Parâmetros Laboratoriais:
  - Bilirrubina Total: {formtext: name=Bilirrubina Total (mg/dL); default=1.4} mg/dL
  - INR: {formtext: name=INR; default=1.2}
  - Creatinina: {formtext: name=Creatinina (mg/dL); default=1.0} mg/dL
  - Sódio Sérico: {formtext: name=Sódio (mEq/L); default=136} mEq/L
• ESCORE MELD-Na CALCULADO: {=meld(Bilirrubina Total (mg/dL), INR, Creatinina (mg/dL), Sódio (mEq/L))} pontos

• Rastreamento e Profilaxias:
  - EDA (Varizes esofagogástricas): {formtext: name=Status EDA/Varizes; default=Sem varizes / Em profilaxia com Carvedilol ou Propranolol}
  - Rastreamento de CHC (USG + Alfa-fetoproteína a cada 6 meses): {formtext: name=Rastreio CHC; default=Solicitado hoje}{cursor}`
    },
    {
      shortcut: "/prep-eda",
      label: "Orientações de Preparo para Endoscopia Digestiva Alta (EDA)",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`ORIENTAÇÕES DE PREPARO PARA ENDOSCOPIA DIGESTIVA ALTA (EDA)

1. JEJUM:
• Jejum absoluto de alimentos sólidos e pastosos por no mínimo 8 (oito) horas antes do exame;
• Água pura (sem gás) em pequenos goles é permitida até 4 (quatro) horas antes do exame. Nas últimas 4 horas, jejum total inclusive de água.

2. MEDICAÇÕES DE USO CONTÍNUO:
• Medicações para pressão arterial ou coração devem ser tomadas no horário habitual com apenas um pequeno gole de água;
• Medicamentos para diabetes (insulina ou hipoglicemiantes orais): NÃO tomar na manhã do exame enquanto estiver em jejum;
• ⚠️ ATENÇÃO (Canetas / Análogos de GLP-1 — Ozempic®, Wegovy®, Saxenda®, Rybelsus®, Mounjaro®): informar à equipe e suspender conforme orientação médica prévia devido ao retardo do esvaziamento gástrico;
• Anticoagulantes / Antiagregantes (Marevan, Xarelto, Eliquis, Pradaxa, Clopidogrel): seguir rigorosamente o prazo de suspensão orientado em consulta caso haja previsão de biópsias ou polipectomia.

3. NO DIA DO EXAME:
• É OBRIGATÓRIO comparecer com um acompanhante maior de 18 anos (devido à sedação, não é permitido dirigir, pilotar ou trabalhar operando máquinas no restante do dia);
• Trazer pedido médico, documento com foto, carteirinha do convênio e laudos de endoscopias anteriores.{cursor}`
    },
    {
      shortcut: "/prep-colono",
      label: "Orientações de Preparo para Colonoscopia",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`ORIENTAÇÕES DE PREPARO PARA COLONOSCOPIA

1. NOS 3 DIAS ANTERIORES AO EXAME:
• Suspender alimentos com sementes, cascas, grãos integrais (chia, linhaça, aveia, milho, pipoca, tomate com semente, kiwi, uva, goiaba), folhas verdes cruas e suplementos de ferro oral.

2. NA VÉSPERA DO EXAME (DIETA LEVE SEM RESÍDUOS):
• Permitidos: arroz branco, macarrão sem molho vermelho, batata cozida, caldo coado de frango ou carne, peito de frango ou peixe grelhado, torrada branca, biscoito água e sal, gelatina clara (amarela ou abacaxi — NÃO usar gelatina vermelha ou roxa), água de coco, isotônicos claros e chás claros;
• PROIBIDOS: leite e derivados, carnes vermelhas, verduras, frutas com bagaço, feijão, bebidas escuras ou alcoólicas;
• Tomar {formtext: name=Laxante de Véspera; default=2 comprimidos de Bisacodil (Dulcolax) às 16h e às 20h + Simeticona 75mg/mL (40 gotas de 8/8h)}.

3. SOLUÇÃO DE LIMPEZA DO CÓLON (CONFORME HORÁRIO DO EXAME):
• Preparo principal: {formmenu: name=Solução de Preparo; default=Manitol a 10% (500 mL de Manitol 20% + 500 mL de água de coco ou suco de limão coado gelado) + 40 gotas de Simeticona, ingerindo 1 copo a cada 10–15 min em 1h30; Macrogol / Polietilenoglicol (Muvinlax — 20 sachês diluídos em 1,5 L de água ou suco claro gelado) + 40 gotas de Simeticona, ingerindo em até 2 horas; Picossulfato de Sódio + Óxido de Magnésio (Picoprep — 2 sachês conforme protocolo fracionado com 2 L de líquidos claros)};
• Caminhar dentro de casa durante a tomada do preparo para auxiliar o trânsito intestinal até que as evacuações fiquem líquidas e claras (aspecto de urina clara).

4. CUIDADOS IMPORTANTES:
• Suspender análogos de GLP-1 (Ozempic®, Wegovy®, Mounjaro®) e anticoagulantes pelo período orientado em consulta;
• Comparecer OBRIGATORIAMENTE com acompanhante maior de 18 anos.{cursor}`
    },
    {
      shortcut: "/laudo-eda",
      label: "Registro Rápido de Resultado de EDA / Colonoscopia no Prontuário",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`REGISTRO DE EXAMES ENDOSCÓPICOS TRAZIDOS:

• ENDOSCOPIA DIGESTIVA ALTA ({formtext: name=Data da EDA; default=Recente}):
  - Esôfago: {formmenu: name=Esôfago; default=Calibre, distensibilidade e mucosa normais.; Esofagite erosiva Grau A de Los Angeles.; Esofagite erosiva Grau B de Los Angeles.; Hérnia hiatal por deslizamento de pequeno porte.}
  - Estômago: {formmenu: name=Estômago; default=Gastrite enantematosa antral leve.; Mucosa gástrica de aspecto endoscópico normal.; Gastrite erosiva plana antral moderada.; Pangastrite enantematosa / atrófica.}
  - Duodeno: {formmenu: name=Duodeno; default=Bulbo e 2ª porção duodenal sem alterações.; Duodenite enantematosa leve.; Úlcera bulbar cicatrizada (S2 de Sakita).}
  - Pesquisa de H. pylori (Urease / Histopatológico): {formmenu: name=H. pylori; default=Negativo (-); Positivo (+); Aguardando anatomopatológico}
{formtoggle: name=Registrar também Colonoscopia; default=no}
• COLONOSCOPIA ({formtext: name=Data da Colono; default=Recente}):
  - Qualidade do Preparo (Escala de Boston): {formtext: name=Boston; default=9/9 (3+3+3)}
  - Achados: {formtext: name=Achados Colonoscopia; default=Exame até íleo terminal/ceco sem lesões mucosas. Doença diverticular dos cólons não complicada.}
  - Polipectomia / Histopatológico: {formtext: name=Anatomopatológico Colono; default=Sem pólipos / Adenoma tubular com displasia de baixo grau ressecado com margens livres}
  - Próxima colonoscopia de vigilância recomendada em: {formmenu: name=Vigilância Colono; default=10 anos; 5 anos; 3 anos; 1 ano}{endformtoggle}{cursor}`
    },
    {
      shortcut: "/exames-gastro",
      label: "Solicitação de Exames — Painel Gastroenterologia & Hepatologia",
      folder: "02. Gastroenterologia & Hepatologia",
      text:
`SOLICITAÇÃO DE EXAMES — GASTROENTEROLOGIA E HEPATOLOGIA:

1. Hemograma completo e Plaquetas
2. TGO (AST), TGP (ALT), Fosfatase Alcalina (FA) e Gama-GT (GGT)
3. Bilirrubina total e frações, Proteínas totais e frações (Albumina/Globulina) e TAP com INR
4. Glicemia de jejum, HbA1c, Insulina basal (HOMA-IR) e Perfil Lipídico completo
5. Ferro sérico, Ferritina, Índice de Saturação de Transferrina, Vitamina B12, Ácido Fólico e Vitamina D
6. Ureia, Creatinina, TSH e T4 livre{formtoggle: name=Incluir Sorologias Hepatites Virais; default=yes}
7. HBsAg, Anti-HBc total, Anti-HBs e Anti-HCV{endformtoggle}{formtoggle: name=Incluir Investigação de Doença Celíaca; default=no}
8. Anti-transglutaminase tecidual IgA (anti-tTG IgA) e Dosagem de IgA sérica total{endformtoggle}{formtoggle: name=Incluir Investigação de Diarreia Crônica / DII; default=no}
9. Calprotectina Fecal Quantitativa, Proteína C Reativa (PCR), VHS, EPF (3 amostras) e Elastase Pancreática Fecal{endformtoggle}{formtoggle: name=Incluir Ultrassonografia de Abdome Total; default=yes}
• Ultrassonografia de Abdome Total{endformtoggle}{cursor}`
    },

    // =========================================================================
    // 03. GERIATRIA
    // =========================================================================
    {
      shortcut: "/aga",
      label: "Avaliação Geriátrica Ampla (AGA) Estruturada + IMC do Idoso",
      folder: "03. Geriatria",
      text:
`AVALIAÇÃO GERIÁTRICA AMPLA (AGA) — {time: DD/MM/YYYY}

1. IDENTIFICAÇÃO E SUPORTE SOCIAL:
• Idade: {formtext: name=Idade (anos); default=76} anos | Acompanhante/Cuidador principal: {formtext: name=Acompanhante; default=Comparece acompanhado(a) de familiar}
• Arranjo domiciliar e rede de apoio: {formtext: name=Suporte Social; default=Reside com familiares, bom suporte social}

2. FUNCIONALIDADE GLOBAL:
• AVDs Básicas (Índice de Katz — 0 a 6): {formmenu: name=Katz (AVDs Básicas); default=6/6 — Independente para todas as AVDs básicas (banho, vestir-se, higiene, transferência, continência, alimentação); 5/6 — Dependência parcial em 1 AVD básica; 3 a 4/6 — Dependência moderada para AVDs básicas; 0 a 2/6 — Dependência importante para AVDs básicas}
• AVDs Instrumentais (Escala de Lawton — 9 a 27): {formmenu: name=Lawton (AIVDs); default=Independente para AIVDs (finanças, medicações, transporte, telefone, compras); Dependência parcial para AIVDs (necessita supervisão em finanças e medicações); Dependente para a maioria das AIVDs}

3. COGNIÇÃO E HUMOR:
• Queixa cognitiva / Memória: {formmenu: name=Cognição; default=Cognição preservada, sem impacto funcional. MEEM compatível com a escolaridade.; Queixa subjetiva de esquecimentos recentes, mantendo funcionalidade.; Declínio cognitivo em investigação / acompanhamento.}
• Humor e Sono (GDS-15): {formmenu: name=Humor e Sono; default=Humor eutímico, sem critérios para transtorno depressivo. Sono preservado.; Sintomas depressivos leves / apatia em avaliação.; Insônia de manutenção / fragmentação do sono.}

4. MOBILIDADE, EQUILÍBRIO E QUEDAS:
• Marcha e Transferência (TUG): {formmenu: name=Mobilidade e Marcha; default=Marcha independente e segura, sem dispositivo de auxílio (TUG < 12s).; Marcha lentificada / cautelosa, usa bengala para longas distâncias.; Instabilidade postural com alto risco de quedas / usa andador.}
• Histórico de quedas nos últimos 12 meses: {formmenu: name=Quedas no último ano; default=Nega quedas no último ano.; 1 queda sem fratura nos últimos 12 meses.; Quedas recorrentes (2 ou mais) — orientado protocolo de prevenção.}

5. NUTRIÇÃO, ESFÍNCTERES E SENSORIAL:
• Peso: {formtext: name=Peso (kg); default=65} kg | Altura: {formtext: name=Altura (m); default=1.62} m | IMC Geriátrico: {=imc(Peso (kg), Altura (m))} kg/m² — {=classImc(Peso (kg), Altura (m), Idade (anos))}
• Continência Urinária e Fecal: {formtext: name=Continência; default=Continente urinário e fecal}
• Visão e Audição: {formtext: name=Sensorial; default=Visão corrigida com óculos, audição funcional}

6. POLIFARMÁCIA E CONCILIAÇÃO MEDICAMENTOSA:
• Medicações em uso e revisão pelos Critérios de Beers: {formparagraph: name=Conciliação e Beers; default=Realizada conciliação medicamentosa; sem uso de medicamentos potencialmente inapropriados (MPI) ativos.}

7. SÍNTESE E PLANO DE CUIDADO GERIÁTRICO:
• Classificação Clínico-Funcional: {formmenu: name=Fragilidade; default=Idoso Robusto (Independente e autônomo); Idoso Pré-Frágil (Em risco de fragilização); Idoso Frágil (Com declínio funcional estabelecido)}
• Conduta:
{formparagraph: name=Plano Geriátrico; default=1. Estímulo à atividade física multicomponente (treino de força e equilíbrio);\n2. Adequação proteico-calórica e hidratação;\n3. Atualização vacinal (Influenza, Pneumocócica, Herpes-Zóster, dT, COVID-19);\n4. Prevenção ambiental de quedas.}{cursor}`
    },
    {
      shortcut: "/clcr",
      label: "Calculadora de Clearance de Creatinina (Cockcroft-Gault) & Função Renal",
      folder: "03. Geriatria",
      text:
`AVALIAÇÃO DA FUNÇÃO RENAL (FÓRMULA DE COCKCROFT-GAULT):
• Idade: {formtext: name=Idade (anos); default=78} anos | Peso: {formtext: name=Peso (kg); default=64} kg | Sexo: {formmenu: name=Sexo; default=Feminino; Masculino}
• Creatinina Sérica: {formtext: name=Creatinina (mg/dL); default=1.1} mg/dL
• Clearance de Creatinina Estimado (ClCr): {=cockcroft(Idade (anos), Peso (kg), Creatinina (mg/dL), Sexo)} mL/min
• Classificação Funcional Estimada: {=estagioDrc(cockcroft(Idade (anos), Peso (kg), Creatinina (mg/dL), Sexo))}
• Conduta Renal: Evitar drogas nefrotóxicas (AINEs, contrastes iodados desnecessários) e ajustar doses de medicamentos de excreção renal conforme ClCr.{cursor}`
    },
    {
      shortcut: "/quedas",
      label: "Plano de Prevenção de Quedas e Adaptação Domiciliar para Idosos",
      folder: "03. Geriatria",
      text:
`ORIENTAÇÕES DE PREVENÇÃO DE QUEDAS E SEGURANÇA DOMICILIAR

1. ADAPTAÇÕES NO AMBIENTE DOMÉSTICO:
• Retirar tapetes soltos, fios atravessados e objetos baixos nas áreas de circulação;
• Instalar barras de apoio firmes dentro do box (próximo ao chuveiro) e ao lado do vaso sanitário;
• Utilizar tapete antiderrapante dentro do box e, se necessário, cadeira própria de banho;
• Manter iluminação noturna (luz de presença/sensor) no quarto, corredor e banheiro;
• Evitar pisos encerados ou molhados; utilizar corrimão bilateral em escadas.

2. CUIDADOS PESSOAIS E MEDICAMENTOSOS:
• Utilizar sempre calçados fechados, firmes no calcanhar e com solado de borracha antiderrapante (evitar chinelos de dedo ou meias lisas);
• Ao acordar ou levantar-se da cama/poltrona, sentar-se na borda por 1 a 2 minutos antes de ficar em pé (prevenção de hipotensão postural);
• Manter hidratação adequada ao longo do dia e revisão periódica da acuidade visual;
• Praticar fisioterapia motora / exercícios de fortalecimento muscular de membros inferiores e equilíbrio.{cursor}`
    },
    {
      shortcut: "/delirium",
      label: "Manejo Não-Farmacológico de Delirium e Higiene do Sono no Idoso",
      folder: "03. Geriatria",
      text:
`ORIENTAÇÕES — HIGIENE DO SONO E PREVENÇÃO DE CONFUSÃO MENTAL (DELIRIUM) NO IDOSO:

1. CICLO SONO-VIGÍLIA E ORIENTAÇÃO AMBIENTAL:
• Estimular exposição à luz solar natural pela manhã e manter o ambiente bem iluminado e ativo durante o dia;
• Evitar cochilos prolongados após as 15h;
• À noite, reduzir estímulos sonoros e luminosos (desligar TV no quarto ao dormir, manter apenas luz noturna indireta para segurança);
• Manter relógio visível, calendário atualizado e objetos familiares no ambiente;
• Garantir o uso diário dos óculos e aparelhos auditivos durante o dia.

2. FATORES PRECIPITANTES A VIGIAR:
• Manter boa hidratação oral diurna (evitar excesso de líquidos 2h antes de deitar para reduzir noctúria);
• Vigiar hábito intestinal (constipação/fecaloma), retenção urinária, dor não controlada ou sinais precoces de infecção;
• Evitar medicamentos sedativos/hipnóticos benzodiazepínicos e fármacos com ação anticolinérgica.{cursor}`
    },
    {
      shortcut: "/desprescricao",
      label: "Registro de Revisão de Polifarmácia e Desprescrição Gradual (Beers)",
      folder: "03. Geriatria",
      text:
`REVISÃO FARMACOTERAPÊUTICA E PLANO DE DESPRESCRIÇÃO SEGURA:

• Medicamento(s) em revisão (Critérios de Beers / STOPP-START): {formtext: name=Medicamento Alvo; default=Uso prolongado de IBP / Benzodiazepínico / Polifarmácia}
• Motivo clínico da desprescrição: {formmenu: name=Motivo; default=Risco de eventos adversos superior ao benefício clínico atual no idoso; Ausência de indicação atual para manutenção por longo prazo; Prevenção de quedas, sedação diurna e declínio cognitivo; Simplificação posológica e redução de interações medicamentosas}
• Esquema de desmame / substituição orientado:
{formparagraph: name=Esquema de Desmame; default=Redução gradual de 25% a 50% da dose a cada 2 semanas, com monitoramento clínico de sintomas de rebote.}
• Paciente e familiares orientados quanto ao cronograma e sinais de retorno.{cursor}`
    },

    // =========================================================================
    // 04. PRESCRIÇÕES, ATESTADOS & DOCUMENTOS
    // =========================================================================
    {
      shortcut: "/receita",
      label: "Estrutura de Receituário Médico",
      folder: "04. Prescrições, Atestados & Documentos",
      text:
`RECEITUÁRIO MÉDICO

Paciente: {formtext: name=Nome do Paciente}

{formmenu: name=Modalidade; default=USO INTERNO:; USO CONTÍNUO:; USO TÓPICO:}

1. {cursor}


Data: {time: DD/MM/YYYY}
{import: /assinatura}`
    },
    {
      shortcut: "/atestado",
      label: "Atestado Médico (com Dias de Afastamento e CID Opcional)",
      folder: "04. Prescrições, Atestados & Documentos",
      text:
`ATESTADO MÉDICO

Atesto, para os devidos fins, que o(a) Sr.(a) {formtext: name=Nome do Paciente}{formtoggle: name=Incluir CPF/RG; default=no}, portador(a) do documento {formtext: name=CPF/RG; default=000.000.000-00}{endformtoggle}, foi atendido(a) em consulta médica nesta data ({time: DD/MM/YYYY}), necessitando de {formmenu: name=Período de Afastamento; default=1 (um) dia de afastamento de suas atividades laborais/escolares na data de hoje; 2 (dois) dias de afastamento de suas atividades a partir desta data; 3 (três) dias de afastamento de suas atividades a partir desta data; 5 (cinco) dias de afastamento de suas atividades a partir desta data; 7 (sete) dias de afastamento de suas atividades a partir desta data; 14 (quatorze) dias de afastamento de suas atividades a partir desta data; dispensa de suas atividades no período da consulta médica realizada hoje}.
{formtoggle: name=Incluir CID-10 (com autorização do paciente); default=no}
CID-10: {formtext: name=CID-10; default=K29 / K21 / Z00.0} (Autorizado pelo(a) paciente).{endformtoggle}

Data: {time: D [de] MMMM [de] YYYY}.

{import: /assinatura}`
    },
    {
      shortcut: "/relatorio",
      label: "Relatório / Laudo Médico Detalhado",
      folder: "04. Prescrições, Atestados & Documentos",
      text:
`RELATÓRIO MÉDICO

Paciente: {formtext: name=Nome do Paciente}
Idade: {formtext: name=Idade; default=}

Declaro, para os devidos fins, que o(a) paciente acima identificado(a) encontra-se sob acompanhamento médico em {formmenu: name=Especialidade; default=Gastroenterologia e Clínica Médica; Geriatria e Clínica Médica; Clínica Médica}, apresentando o seguinte quadro clínico:

• Histórico Clínico e Exames Complementares:
{formparagraph: name=Resumo Clínico; default=Paciente em seguimento regular, com diagnóstico confirmado por avaliação clínica e exames complementares.}

• Diagnóstico(s) / CID-10: {formtext: name=CID-10; default=K21 / K58 / I10}

• Conduta Terapêutica e Recomendações:
{formparagraph: name=Conduta e Recomendações; default=Necessita manter tratamento farmacológico contínuo e acompanhamento especializado periódico.}

Coloco-me à disposição para quaisquer esclarecimentos adicionais que se façam necessários.

Data: {time: D [de] MMMM [de] YYYY}.

{import: /assinatura}`
    },
    {
      shortcut: "/encaminhamento",
      label: "Guia de Encaminhamento / Solicitação de Parecer",
      folder: "04. Prescrições, Atestados & Documentos",
      text:
`ENCAMINHAMENTO MÉDICO / SOLICITAÇÃO DE PARECER

Ao(À) Ilmo.(a) Colega Especialista em: {formtext: name=Especialidade de Destino; default=Cirurgia do Aparelho Digestivo / Cardiologia / Nutrição}

Prezado(a) Colega,

Encaminho para avaliação e conduta especializada o(a) paciente {formtext: name=Nome do Paciente}, {formtext: name=Idade; default=} anos, em acompanhamento por {formtext: name=Hipótese / Diagnóstico; default=quadro gastroenterológico / clínico}.

• Resumo Clínico e Exames Realizados:
{formparagraph: name=Resumo do Caso; default=Paciente apresenta quadro clínico descrito acima, já submetido à avaliação inicial.}

• Medicações em uso atual: {formtext: name=Medicações em Uso; default=Conforme receita em anexo}

Desde já agradeço a atenção e aguardo contra-referência.

Atenciosamente,
Data: {time: DD/MM/YYYY}
{import: /assinatura}`
    },
    {
      shortcut: "/assinatura",
      label: "Assinatura Médica Padrão (Usada nos Documentos)",
      folder: "04. Prescrições, Atestados & Documentos",
      text:
`__________________________________________
Médico(a) — Clínica Médica · Gastroenterologia · Geriatria
CRM: _______________ | RQE: _______________`
    },

    // =========================================================================
    // 05. COMUNICAÇÃO & USO PROFISSIONAL GERAL
    // =========================================================================
    {
      shortcut: "/msg-exames",
      label: "Mensagem Rápida (WhatsApp / E-mail) — Retorno de Exames",
      folder: "05. Comunicação & Uso Geral",
      text:
`Olá, {formtext: name=Nome do Paciente}! Tudo bem?

Avaliei os resultados dos seus exames enviados. {formmenu: name=Resultado Geral; default=De forma geral, os resultados estão dentro do esperado e sem alterações preocupantes!; Identifiquei alguns pontos que precisam de ajuste simples na nossa conduta (como reposição vitamínica/ajuste de dose), sem motivo para preocupação.; Gostaria de revisar alguns detalhes com você em consulta de retorno para ajustarmos seu tratamento da melhor forma.}

{formparagraph: name=Orientação Específica; default=Mantenha as medicações e orientações conforme combinamos na consulta.}{cursor}

Atenciosamente,`
    },
    {
      shortcut: "/msg-retorno",
      label: "Mensagem Rápida (WhatsApp / E-mail) — Orientações Pós-Consulta",
      folder: "05. Comunicação & Uso Geral",
      text:
`Olá, {formtext: name=Nome do Paciente}!

Segue o resumo das orientações da nossa consulta de hoje ({time: DD/MM/YYYY}):
1. Seguir a receita médica e as orientações dietéticas entregues;
2. Realizar os exames solicitados e agendar seu retorno assim que estiver com os resultados em mãos;
3. Em caso de dúvidas ou sintomas de alarme, entre em contato.

Melhoras e excelente semana!{cursor}`
    },
    {
      shortcut: "/preencher-form",
      label: "Automação de Formulário com Tecla Tab ({key: tab})",
      folder: "05. Comunicação & Uso Geral",
      text: `{formtext: name=Campo 1; default=Consulta Clínica}{key: tab}{formtext: name=Campo 2; default=Gastroenterologia / Geriatria}`
    },
    {
      shortcut: "/hoje",
      label: "Data de Hoje (DD/MM/AAAA)",
      folder: "05. Comunicação & Uso Geral",
      text: `{time: DD/MM/YYYY}`
    }
  ];

  root.MEDICAL_STARTERS = MEDICAL_STARTERS;
})(typeof globalThis !== "undefined" ? globalThis : this);
