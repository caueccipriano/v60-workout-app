# V60 — vídeos de execução licenciados

Versão de integração: 3.4.0

## Licença

Os vídeos desta camada são provenientes do Pexels e usados sob a Licença Pexels:

- https://www.pexels.com/pt-br/licenca/
- uso gratuito em sites e aplicativos;
- uso comercial permitido conforme os termos do Pexels;
- atribuição não obrigatória;
- o V60 não implica endosso de atletas, criadores, marcas ou academias retratadas.

Os arquivos não são revendidos nem oferecidos como biblioteca de mídia independente. O V60 usa os vídeos como demonstração dentro de uma experiência de treino com instruções, séries, repetições, descanso e referência técnica própria.

## Regra de precisão

`exact` = vídeo compatível com o padrão de movimento/equipamento do exercício.

`equivalent` = vídeo usado apenas para demonstrar o padrão corporal geral. Nestes casos, o aplicativo identifica o clipe como **movimento equivalente** e exibe imediatamente a referência técnica V60 com a máquina, a pegada e a trajetória exatas.

## Mapeamento

| Exercício | Pexels ID | Correspondência |
| --- | ---: | --- |
| supino inclinado | 4920810 | equivalent |
| desenvolvimento sentado | 4367541 | exact |
| elevação lateral unilateral | 5319088 | equivalent |
| crucifixo baixo → alto | 31105899 | equivalent |
| tríceps pushdown | 5319433 | exact |
| tríceps acima da cabeça | 6296281 | equivalent |
| leg press 45° | 36457367 | exact |
| agachamento Smith | 6892543 | exact |
| cadeira extensora | 36539451 | exact |
| flexora sentada | 26540715 | equivalent |
| abdutora | 8756633 | equivalent |
| panturrilha no leg press | 32115656 | equivalent |
| puxada alta aberta | 5983521 | exact |
| remada baixa | 4367642 | exact |
| pullover braços estendidos | 34324804 | equivalent |
| crucifixo inverso | 34491184 | equivalent |
| rosca bíceps na polia | 5319438 | equivalent |
| rosca martelo | 35075300 | equivalent |
| crunch ajoelhado | 36484275 | equivalent |
| supino reto | 5320004 | equivalent |
| crucifixo na linha do peito | 31105899 | equivalent |
| elevação lateral | 5319088 | equivalent |
| face pull | 10336041 | equivalent |
| tríceps acima da cabeça (quinta) | 6296281 | equivalent |
| rosca bíceps unilateral | 36519964 | equivalent |
| stiff / RDL | 32239229 | equivalent |
| flexora (sexta) | 26540715 | equivalent |
| leg press — pés mais altos | 36457367 | equivalent |
| puxada neutra / fechada | 35585699 | equivalent |
| elevação lateral (sexta) | 5319088 | equivalent |
| abdutora (sexta) | 8756633 | equivalent |
| crunch na polia | 36484275 | equivalent |

## Entrega e fallback

Os clipes são carregados sob demanda a partir da infraestrutura do Pexels, com `preload="metadata"`, `muted`, `playsinline` e `loop`. Se um vídeo não carregar, o V60 exibe automaticamente o guia técnico animado local da camada v4.
