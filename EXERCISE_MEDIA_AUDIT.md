# Traço — Auditoria de mídia de exercícios

Versão: 1.0.1  
Data: 2026-09-17  
Status: **35/35 movimentos auditados**

O Traço não exibe mais clipes `equivalent`. A demonstração ativa é vinculada ao ID do exercício e validada contra nome, equipamento, posição inicial/final e trajetória.

| ID | Cena validada |
| --- | --- |
| `supino-inclinado` | `smithBenchIncline` |
| `desenvolvimento` | `dumbbellPress` |
| `elevacao-lateral` | `cableLateralUnilateral` |
| `crucifixo-baixo-alto` | `cableFlyLowHigh` |
| `triceps-pushdown` | `pushdown` |
| `triceps-overhead` | `overheadTriceps` |
| `leg-press` | `legPressStandard` |
| `agachamento-smith` | `smithSquat` |
| `extensora` | `legExtension` |
| `flexora` | `seatedLegCurl` |
| `abdutora` | `abductor` |
| `panturrilha` | `legPressCalf` |
| `puxada-aberta` | `pulldownWide` |
| `remada-baixa` | `seatedRow` |
| `pullover` | `straightArmPulldown` |
| `crucifixo-inverso` | `reverseFly` |
| `rosca-polia` | `cableCurl` |
| `rosca-martelo` | `hammerCurl` |
| `crunch` | `reverseCrunch` |
| `supino-reto` | `smithBenchFlat` |
| `crucifixo-reto` | `cableFlyHorizontal` |
| `elevacao-lateral-2` | `cableLateralUnilateral` |
| `face-pull` | `facePull` |
| `triceps-overhead-2` | `overheadTriceps` |
| `rosca-unilateral` | `cableCurlUnilateral` |
| `rdl` | `smithRdl` |
| `flexora-2` | `seatedLegCurl` |
| `leg-press-alto` | `legPressHigh` |
| `puxada-neutra` | `pulldownNeutral` |
| `elevacao-lateral-3` | `cableLateralUnilateral` |
| `abdutora-2` | `abductor` |
| `crunch-2` | `kneelingCrunch` |
| `core-crunch-seg` | `kneelingCrunch` |
| `core-pallof-ter` | `pallofPress` |
| `core-woodchop-qui` | `woodchop` |

## Correções confirmadas
- `abdutora` / `abdutora-2`: máquina abdutora; pernas fechadas → abertura lateral.
- `core-pallof-ter`: polia lateral; extensão dos braços à frente sem rotação do tronco.
- elevações laterais de quinta/sexta: padronizadas como unilateral na polia.
- `flexora-2`: padronizada como flexora sentada.

O CI bloqueia regressões para mídia equivalente ou mapeamento divergente.
