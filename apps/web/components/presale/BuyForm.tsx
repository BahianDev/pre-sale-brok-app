"use client";

import { useState } from "react";
import Decimal from "decimal.js";
import { z } from "zod";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUY_MODE, config } from "@/lib/config";
import { lamportsToSol, solToLamports } from "@/lib/format";
import type { ParsedBuyerState, ParsedState, ParsedWhitelistEntry } from "@/lib/anchor/types";
import { buy as buildBuy } from "@/lib/anchor/tx";
import { getClientProgram } from "@/lib/anchor/client";

const formSchema = z.object({
  amount: z
    .string()
    .nonempty("Informe uma quantidade em SOL")
    .refine((value) => Number(value) > 0, "Quantidade deve ser maior que zero")
});

interface BuyFormProps {
  state: ParsedState;
  buyerState: ParsedBuyerState | null;
  whitelistEntry?: ParsedWhitelistEntry | null;
  onRefresh?: () => Promise<void>;
}

export function BuyForm({ state, buyerState, whitelistEntry, onRefresh }: BuyFormProps) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState("0.5");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    const parsed = formSchema.safeParse({ amount });
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? "Erro de validação");
      return;
    }

    if (!publicKey || !anchorWallet) {
      setStatus("Conecte uma carteira para comprar");
      return;
    }

    if (state.currentPhase === "Whitelist" && !whitelistEntry) {
      setStatus("Carteira não está na whitelist para esta fase");
      return;
    }

    try {
      setLoading(true);
      const lamportsDecimal = solToLamports(new Decimal(parsed.data.amount)).toDecimalPlaces(0, Decimal.ROUND_FLOOR);
      const lamports = BigInt(lamportsDecimal.toString());
      const program = getClientProgram(anchorWallet);
      const { instructions } = await buildBuy({
        program,
        buyer: publicKey,
        state,
        lamports
      });

      if (BUY_MODE !== "pretransfer") {
        throw new Error("Modo de compra inválido configurado");
      }

      const transaction = new Transaction().add(...instructions);
      transaction.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, config.commitment);
      setStatus(`Compra enviada: ${signature}`);
      await onRefresh?.();
    } catch (error) {
      setStatus((error as Error).message ?? "Erro ao processar compra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comprar tokens</CardTitle>
        {buyerState && (
          <p className="text-sm text-slate-400">
            Contribuição atual: {lamportsToSol(buyerState.contributedLamports).toFixed(3)} SOL
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Quantidade (SOL)</label>
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" step="0.01" min="0" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Comprar"}
          </Button>
          {status && <p className="text-sm text-slate-400">{status}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export default BuyForm;
