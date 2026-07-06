# arquitetura.md — Frontend

Metodologia: **Feature-Sliced Design (FSD)**.

> Local deste arquivo no repositório: `.claude/rules/arquitetura.md`

---

## Layers (camadas)

Regra de dependência **unidirecional** — uma camada só pode importar das camadas abaixo dela, nunca das acima ou da mesma camada (exceto `app`/`shared`, que não têm slices):

```
app → pages → widgets → features → entities → shared
```

| Layer | Responsabilidade |
|---|---|
| `app` | Inicialização — providers (QueryClient, Router), estilos globais, entrypoint |
| `pages` | Composição de rotas — página inteira ou parte grande de uma rota aninhada |
| `widgets` | Blocos compostos e autossuficientes (ex: Header, OrderSummary) |
| `features` | Ações de negócio que trazem valor ao usuário (ex: criar-pedido, favoritar) |
| `entities` | Entidades de negócio reutilizáveis entre features (ex: Order, Product, User) |
| `shared` | Design system, utils, tipos globais, api client base — sem nada específico do negócio |

`entities` não pode importar de `features` (senão vira circular). Uma feature pode importar de `entities` e `shared`, mas não de outra feature diretamente — se duas features precisarem se comunicar, isso normalmente sobe pra um `widget` ou uma `page` que compõe as duas.

---

## Slices

Dentro de `entities`, `features`, `widgets` e `pages`, o código é dividido em **slices** — uma pasta por domínio de negócio (ex: `entities/order`, `features/criar-pedido`). O nome da slice não é padronizado; é definido pelo vocabulário do próprio negócio.

`app` e `shared` são exceção: não têm slices — são compostos direto por segments.

---

## Segments — os 5 nomes oficiais

Dentro de cada slice, o código se divide em **segments**, que agrupam por propósito técnico. Só existem 5 nomes convencionados:

| Segment | O que guarda |
|---|---|
| `ui` | Componentes visuais, formatadores de exibição, estilos |
| `api` | Chamadas de rede — hooks de React Query, funções de request, mappers de resposta |
| `model` | **Estado** — stores (Zustand), schemas, tipos/interfaces |
| `lib` | Funções auxiliares **sem estado**, usadas só dentro daquela slice — validação, cálculo, formatação |
| `config` | Constantes e feature flags daquela slice (raramente necessário) |

Não invente nomes de segment livremente — o nome deve descrever o propósito técnico do conteúdo. Evite nomes genéricos como `components`, `hooks` ou `types`.

### `model` vs `lib`

- **`model`** fica só com o **estado** em si — o store, os schemas.
- **`lib`** fica com as **funções puras** que operam sobre esse estado — validação, cálculo de total, formatação — sem guardar estado próprio.

### `config`, na prática

Segment raro. Só extrair quando a slice acumula várias constantes/flags que fazem sentido documentar juntas (ex: `MAX_ITEMS_POR_PEDIDO`, feature flags locais). Constantes isoladas cabem no próprio arquivo que as usa — não criar a pasta só por criar.

Cada slice (e cada segment nas camadas `app`/`shared`) precisa expor um **`index.ts`** como Public API — código de fora só importa desse arquivo, nunca de um caminho interno da slice.

---

## Estrutura completa de referência

```
src/
├── app/
│   ├── providers/          # QueryClientProvider, Router
│   └── styles/              # estilos globais, Tailwind base
├── pages/
│   └── criar-pedido/
│       └── ui/CriarPedidoPage.tsx
├── widgets/                  # blocos compostos reutilizáveis
├── features/
│   └── criar-pedido/
│       ├── api/
│       │   └── useCriarPedido.ts    # React Query
│       ├── model/
│       │   └── useNovoPedidoStore.ts # Zustand — SÓ estado
│       ├── lib/
│       │   └── validateNovoPedido.ts # validação + cálculo — funções puras
│       ├── ui/
│       │   └── CriarPedidoForm.tsx
│       └── index.ts                   # Public API da feature
├── entities/
│   └── order/
│       ├── model/types.ts             # shape de Order/OrderItem
│       └── index.ts                    # Public API da entity
└── shared/
    ├── api/httpClient.ts              # cliente HTTP base
    ├── ui/Button.tsx                   # design system
    ├── lib/                             # utils globais (ex: debounce, classNames)
    └── config/                          # VITE_API_URL e afins
```

---

## Exemplo de referência: feature "criar-pedido"

### `shared/api/httpClient.ts`

```typescript
import axios from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});
```

### `shared/ui/Button.tsx`

```tsx
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export function Button({ isLoading, children, disabled, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Enviando...' : children}
    </button>
  );
}
```

### `entities/order/model/types.ts`

```typescript
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'cancelled';
  total: number;
}
```

### `entities/order/index.ts`

```typescript
export type { Order, OrderItem } from './model/types';
```

### `features/criar-pedido/lib/validateNovoPedido.ts`

```typescript
import { OrderItem } from '../../../entities/order';

export interface NovoPedidoInput {
  customerId: string;
  items: OrderItem[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<'customerId' | 'items', string>>;
}

export function validateNovoPedido(input: NovoPedidoInput): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!input.customerId) {
    errors.customerId = 'Cliente é obrigatório';
  }

  if (!input.items || input.items.length === 0) {
    errors.items = 'Pedido precisa ter ao menos 1 item';
  } else if (input.items.some((item) => item.quantity <= 0)) {
    errors.items = 'Quantidade de todos os itens deve ser maior que zero';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function calcularTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}
```

### `features/criar-pedido/api/useCriarPedido.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../../../shared/api/httpClient';
import { Order, OrderItem } from '../../../entities/order';

interface CriarPedidoPayload {
  customerId: string;
  items: OrderItem[];
}

async function criarPedido(payload: CriarPedidoPayload): Promise<Order> {
  const { data } = await httpClient.post<Order>('/orders', payload);
  return data;
}

export function useCriarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: criarPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

### `features/criar-pedido/model/useNovoPedidoStore.ts`

```typescript
import { create } from 'zustand';
import { OrderItem } from '../../../entities/order';

interface NovoPedidoState {
  customerId: string | null;
  items: OrderItem[];
  setCustomer: (customerId: string) => void;
  addItem: (item: OrderItem) => void;
  removeItem: (productId: string) => void;
  reset: () => void;
}

export const useNovoPedidoStore = create<NovoPedidoState>((set) => ({
  customerId: null,
  items: [],

  setCustomer: (customerId) => set({ customerId }),

  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),

  reset: () => set({ customerId: null, items: [] }),
}));
```

### `features/criar-pedido/ui/CriarPedidoForm.tsx`

```tsx
import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import { useNovoPedidoStore } from '../model/useNovoPedidoStore';
import { useCriarPedido } from '../api/useCriarPedido';
import { validateNovoPedido, calcularTotal, ValidationResult } from '../lib/validateNovoPedido';

export function CriarPedidoForm() {
  const { customerId, items, removeItem, reset } = useNovoPedidoStore();
  const { mutate, isPending, isError, error } = useCriarPedido();
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  function handleSubmit() {
    const result = validateNovoPedido({ customerId: customerId ?? '', items });
    setValidation(result);

    if (!result.valid) return;

    mutate(
      { customerId: customerId!, items },
      { onSuccess: () => reset() },
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Novo pedido</h2>

      {customerId ? (
        <p className="text-sm text-slate-600">Cliente: {customerId}</p>
      ) : (
        <p className="text-sm text-red-600">Nenhum cliente selecionado</p>
      )}

      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center justify-between py-2 text-sm">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-xs text-slate-400 hover:text-red-600"
            >
              remover
            </button>
          </li>
        ))}
      </ul>

      {validation && !validation.valid && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {Object.values(validation.errors).map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm text-slate-500">Total</span>
        <span className="font-medium text-slate-900">
          R$ {calcularTotal(items).toFixed(2)}
        </span>
      </div>

      {isError && (
        <p className="text-sm text-red-600">{(error as Error).message}</p>
      )}

      <Button onClick={handleSubmit} isLoading={isPending} className="w-full">
        Confirmar pedido
      </Button>
    </div>
  );
}
```

### `features/criar-pedido/index.ts`

```typescript
export { CriarPedidoForm } from './ui/CriarPedidoForm';
export { useNovoPedidoStore } from './model/useNovoPedidoStore';
```

---

## Notas sobre `mutate` (React Query)

`useMutation` devolve `mutate` — a função que dispara a requisição (nada acontece até ser chamada). Aceita dois argumentos:

1. **`variables`** — o dado enviado, que vira o parâmetro da `mutationFn`.
2. **Callbacks locais** (`onSuccess`, `onError`) — rodam só nessa chamada específica, depois do `onSuccess` global definido no hook.
