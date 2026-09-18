# Traço — Design System 2.3

## Princípio
O Traço é usado durante a academia: mão ocupada/suada, pouco tempo e baixa tolerância a etapas desnecessárias. A UI deve priorizar leitura rápida, alvos grandes, feedback imediato e funcionamento local-first.

## Tokens oficiais
- `--traco-action: #FF3B30` — ações, CTA e estado ativo. Nunca usar para conquista.
- `--traco-base: #090909` — fundo principal.
- `--traco-card: #141414` — cards primários.
- `--traco-card-2: #1A1A1A` — profundidade secundária.
- `--traco-text: #F3F2EE` — texto principal.
- `--traco-muted: #A8ABB2` — texto secundário.
- `--traco-achievement: #F4C542` — PR, streak, XP e level-up exclusivamente.

## Tipografia
- Editorial: DM Serif Display — apenas saudação e títulos de tela.
- Interface: Inter — labels, botões, navegação e copy.
- Números: Space Grotesk — carga, reps, XP, tempo e métricas.

## Interação
- Área de toque mínima: 44px; controles de treino: 48–56px.
- Ação primária recebe feedback visual + haptic.
- Vermelho significa “agir/agora”. Dourado significa “conquista”.
- Mensagens de erro são humanas: “faltou preencher a carga”, nunca “Erro: campo obrigatório”.

## Treino ativo
- Nenhum thumbnail/marca de terceiro aparece no fluxo principal.
- “ver execução” abre uma experiência separada.
- +/− e digitação manual coexistem.
- Progresso do exercício e série deve estar sempre visível.

## Offline
- Dados e app shell funcionam localmente.
- Vídeo externo exige rede; guia técnico local é fallback obrigatório.
- Nunca impedir registro de treino por falha de rede.

## Branding
- Nome visível: Traço.
- `v60_*` só é permitido como namespace interno de compatibilidade.
- Versão aparece apenas em “mais”/diagnóstico, nunca no header diário.
