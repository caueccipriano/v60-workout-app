# Traço — treino e evolução

PWA pessoal de treino, progressão e consistência, feita para acompanhar o treino real sem prender a rotina aos dias da semana.

## Produto
- sequência flexível A → E, baseada no último treino concluído
- recomendação automática do próximo treino
- registro persistente de carga e repetições
- descanso automático e cronômetro de sessão
- core concentrado em sessões estratégicas, sem obrigação diária
- cardio opcional e registrável
- meta semanal e streak
- histórico por sessão
- evolução de carga por exercício
- frequência e volume por semana
- medidas corporais
- backup/importação em JSON
- instalação como PWA
- vídeos licenciados + guia técnico

## Marca
**Traço** representa linha, definição e progresso.

O símbolo une três ideias em um único gesto:
- um **T** abstrato;
- uma referência sutil à barra de treino;
- uma linha ascendente de evolução.

Paleta principal: lime + preto, com azul e laranja como cores funcionais da interface.

## Compatibilidade de dados
As chaves internas `v60_*` são mantidas temporariamente para preservar histórico, cargas, presença e configurações de instalações anteriores. Isso é intencional; o produto visível já é 100% Traço.

## Rodar localmente

```bash
python -m http.server 8080
```

Depois abra `http://localhost:8080`.

## Estado atual
- PWA local-first com treino, histórico, progressão, medidas e fotos de evolução
- fila persistente permite trocar a ordem durante o treino sem perder séries, cargas ou repetições
- backup/importação preserva os dados locais
- camadas visuais mantêm compatibilidade com instalações V60 anteriores

## Próximos blocos
- sincronização opcional entre dispositivos
- testes automatizados de regressão da sessão e das migrações
- consolidação gradual das camadas legadas de UI
