# V60 — treino pessoal

PWA simples, sem dependências e sem build, feita para acompanhar a ficha de 5 dias.

## O que já funciona
- Treino do dia e ficha completa de segunda a sexta
- Modo Academia
- Registro de carga, repetições e séries concluídas
- Cronômetro da sessão e descanso automático
- Histórico por sessão
- Gráfico de evolução de carga por exercício
- Regra de progressão baseada na faixa de repetições
- Medidas corporais
- Backup/importação em JSON
- Instalação como PWA
- Dados salvos localmente no navegador (localStorage)

## Rodar no computador
Qualquer servidor estático funciona.

### Python
```bash
python -m http.server 8080
```
Depois abra `http://localhost:8080`.

### VS Code
Use a extensão Live Server e abra `index.html`.

## Publicar grátis
Pode ser publicado no GitHub Pages, Netlify ou Vercel como site estático.

## Próxima versão sugerida
- Supabase Auth + banco
- Sincronização celular/PC
- Fotos de evolução
- Notificações
- Edição de ficha dentro do app
