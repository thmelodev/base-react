# CLAUDE.md — Frontend

Contexto de projeto para o Claude Code. Leia também `.claude/rules/arquitetura.md` antes de criar ou alterar qualquer arquivo — ele define onde cada tipo de código deve morar.

## Stack

- **React** — biblioteca de UI
- **Vite** — build tool e dev server
- **TailwindCSS** — estilização utilitária
- **Zustand** — estado de UI (client state)
- **React Query** (`@tanstack/react-query`) — estado de servidor (fetch, cache, mutations)
- **Axios** — cliente HTTP usado por dentro do React Query
- **React Router** — roteamento
- **TypeScript** — tipagem em todo o projeto

## Convenções gerais

- Metodologia de organização de pastas: **Feature-Sliced Design (FSD)** — ver `arquitetura.md`.
- **React Query** é sempre a fonte de dados de servidor — nunca usar Zustand pra guardar dado que vem de API.
- **Zustand** guarda só estado de UI (rascunho de formulário, filtros, modais abertos, wizard em andamento).
- Toda chamada HTTP passa pelo cliente único em `shared/api/httpClient.ts` (instância do **Axios**) — nenhum componente ou hook chama `axios`/`fetch` direto.
- Rotas (**React Router**) são configuradas em `app/providers/` e compostas em `pages/`.
- Todo componente reutilizável de design system vai em `shared/ui/`.
- Cada slice (pasta de feature/entity) expõe um `index.ts` como Public API — import de fora da slice sempre passa por ali, nunca por caminho interno.

## Comandos

```bash
npm run dev       # inicia o servidor de desenvolvimento (Vite)
npm run build     # build de produção
npm run lint      # lint do projeto
```

## Variáveis de ambiente

- `VITE_API_URL` — URL base da API consumida pelo `httpClient`.
