# Solana Presale dApp

Este repositório contém um monorepo minimal com a aplicação Next.js localizada em `apps/web`, construída para interagir com o programa Anchor `presale` na rede Solana. A stack utiliza App Router (Next.js 14), Tailwind CSS, shadcn/ui e integrações completas com o Anchor IDL fornecido em `anchor/idl/presale.json`.

## Estrutura

```
anchor/idl/presale.json  # IDL do programa Anchor
apps/web/                # Aplicação Next.js 14 (App Router)
```

Dentro de `apps/web` você encontrará:

- `app/` – páginas (buyer e admin) e handlers de API.
- `components/` – componentes UI (wallet, presale, shadcn/ui).
- `lib/` – integrações Solana/Anchor, parsing de contas, formatação, helpers admin.
- `styles/` – estilos globais Tailwind.

## Requisitos

- Node.js 18+
- pnpm (`npm install -g pnpm`)

## Configuração de ambiente

Copie o arquivo `.env.local.example` para `.env.local` na pasta `apps/web` e ajuste os valores:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Variáveis principais:

- `NEXT_PUBLIC_SOLANA_RPC` / `NEXT_PUBLIC_SOLANA_COMMITMENT`: endpoint e commitment do cluster.
- `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_MINT_ADDRESS`, `NEXT_PUBLIC_AUTHORITY_ADDRESS`: informações do programa e seed.
- `NEXT_PUBLIC_TREASURY_ADDRESS`: conta da tesouraria.
- `NEXT_PUBLIC_SEED_*`: seeds fixas usadas nos PDAs (deixe os valores padrão se o contrato não mudou).
- `NEXT_PUBLIC_STATE_ADDRESS` / `NEXT_PUBLIC_STATE_BUMP` (opcionais): informe o PDA já derivado do estado quando não for possível calculá-lo a partir das seeds (útil em implantações legadas).
- `ADMIN_KEYPAIR_BASE58`: chave da autoridade em Base58 ou JSON (apenas servidor, não expor ao cliente).

> ⚠️ O fluxo de compra utiliza **pre-transferência** de lamports. A transação enviada pelo cliente possui duas instruções: `SystemProgram.transfer` (buyer → state PDA) seguida da chamada `program.methods.buy`. O contrato não assina pelo comprador, portanto essa pré-transferência é obrigatória.

## Instalando dependências

```bash
cd apps/web
pnpm install
```

## Scripts

- `pnpm dev` – inicia o servidor de desenvolvimento Next.js.
- `pnpm build` – build de produção.
- `pnpm start` – inicia o servidor em produção (após build).
- `pnpm lint` – executa ESLint.
- `pnpm format` – aplica Prettier.

## IDL

O IDL do programa está versionado em `anchor/idl/presale.json`. Caso o programa seja atualizado, substitua esse arquivo para refletir as alterações de métodos, contas e erros.

## Fluxo Buyer

- Conecta a carteira (Phantom/Solflare) pelo `WalletAdapter`.
- Visualiza fase atual, caps e progresso (`SaleStats`).
- Envia compras com conversão SOL → lamports e validação com `zod` (`BuyForm`).
- Calcula vesting utilizando `computeVestedBps` espelhando a lógica on-chain (`ClaimCard`).
- Permite refund quando venda cancelada ou soft cap não atingido (`RefundCard`).

## Fluxo Admin

A página `/admin` exige a carteira da autoridade (mesmo endereço usado para derivar o PDA `state`). Quando autenticado:

- Gerencia whitelist com limite por carteira (`WhitelistForm`).
- Avança fases, finaliza, cancela e executa withdraw com rotas server-side assinadas com `ADMIN_KEYPAIR_BASE58` (`PhaseControls`).

As rotas admin (`/api/admin/*`) executam transações no servidor usando `getServerProgram` + `Keypair` carregado via variável de ambiente. Nenhuma chave privada é exposta ao cliente.

## Executando no Devnet

1. Configure `apps/web/.env.local` apontando para Devnet (padrão do exemplo).
2. Garanta que o programa Anchor esteja implantado com o IDL correspondente e seeds compatíveis.
3. Disponibilize fundos na conta da autoridade (para taxas das transações server-side) e no comprador (para contribuições).
4. Rode `pnpm dev` em `apps/web` e acesse `http://localhost:3000`.

## Prints / UI

- **Buyer**: Dashboard com status da venda, formulário de compra, cards de claim/refund.
- **Admin**: Controles de whitelist, fases e operações finais.

(Adapte com seus próprios screenshots/GIFs conforme a implementação evoluir.)

## Observações

- Todo o código é TypeScript estrito, sem `any` implícitos.
- Tratamento de erros com mensagens amigáveis em formulários e rotas.
- `BUY_MODE` configurado como `'pretransfer'` para refletir a exigência atual do contrato.
- O provider Anchor/Wallet é isolado em `components/wallet/Provider` e usado globalmente em `app/layout.tsx`.
