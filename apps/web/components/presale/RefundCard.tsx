"use client";

import { useMemo, useState } from "react";
import Decimal from "decimal.js";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedBuyerState, ParsedState } from "@/lib/anchor/types";
import { refund as buildRefund } from "@/lib/anchor/tx";
import { getClientProgram } from "@/lib/anchor/client";
import { config } from "@/lib/config";

interface RefundCardProps {
  state: ParsedState;
  buyerState: ParsedBuyerState | null;
  onRefresh?: () => Promise<void>;
}

export function RefundCard({ state, buyerState, onRefresh }: RefundCardProps) {
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalRaised = new Decimal(state.totalRaisedLamports);
  const softCap = new Decimal(state.softCapLamports);
  const saleEnded = Math.floor(Date.now() / 1000) > state.endTs;

  const canRefund = useMemo(() => {
    if (!buyerState) return false;
    if (state.canceled) return true;
    if (saleEnded && totalRaised.lt(softCap)) return true;
    return false;
  }, [buyerState, saleEnded, softCap, state.canceled, totalRaised]);

  const handleRefund = async () => {
    if (!publicKey || !anchorWallet) {
      setStatus("Conecte uma carteira para solicitar reembolso");
      return;
    }
    if (!buyerState) {
      setStatus("Nenhuma contribuição encontrada");
      return;
    }

    try {
      setLoading(true);
      const program = getClientProgram(anchorWallet);
      const { instruction } = await buildRefund({ program, buyer: publicKey, state });
      const tx = new Transaction().add(instruction);
      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, config.commitment);
      setStatus(`Reembolso enviado: ${signature}`);
      await onRefresh?.();
    } catch (error) {
      setStatus((error as Error).message ?? "Erro ao solicitar reembolso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>Estado: {state.canceled ? "Cancelado" : saleEnded ? "Encerrado" : "Em andamento"}</p>
        <p>Soft cap atingido? {totalRaised.gte(softCap) ? "Sim" : "Não"}</p>
        <Button onClick={handleRefund} disabled={!canRefund || loading}>
          {loading ? "Enviando..." : "Solicitar refund"}
        </Button>
        {status && <p className="text-xs text-slate-400">{status}</p>}
        {!canRefund && <p className="text-xs text-slate-500">Refund disponível apenas se cancelado ou sem atingir soft cap.</p>}
      </CardContent>
    </Card>
  );
}

export default RefundCard;
